import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document, DocumentResult, paramSearch } from 'src/global/common';
import {
  buildFindManyQuery,
  FindManyWrapper,
  FindOneWrapper,
} from 'src/global/helpers';
import { In, Not, Repository } from 'typeorm';
import { User } from '../users/entity/user.entity';
import { EmailCenter } from './entities/email-center.entity';
import {
  createEmail,
  EmailRecipient,
  EmailStatus,
  findManyEmail,
  findOneEmail,
  updateEmail,
} from './interface';
import { EmailJobWorker, template } from 'src/global/services';
import { Role } from '@app/users/interface/user.interface';
import { validate as isUuid } from 'uuid';
@Injectable()
export class EmailCenterService {
  constructor(
    @InjectRepository(EmailCenter)
    private readonly emailCenter: Repository<EmailCenter>,
    @InjectRepository(User) private readonly users: Repository<User>,

    @Inject(forwardRef(() => EmailJobWorker))
    private readonly emailJobWorker: EmailJobWorker,
  ) {}

  async create(create: createEmail) {
    const { draft, schedule, ...data } = create;
    const recipients = await this.recipients(data.recipient, data.selected);

    if (draft) {
      const save_draft = this.emailCenter.create({
        ...data,
        status: EmailStatus.draft,
      });
      return this.emailCenter.save(save_draft);
    }

    if (schedule) {
      const save_schedule = this.emailCenter.create({
        ...data,
        status: EmailStatus.scheduled,
      });
      const delay = data.scheduleDate.getTime() - Date.now();

      const save_data = await this.emailCenter.save(save_schedule);
      this.emailJobWorker.scheduleDelayedEmail(
        {
          emailId: save_data.id,
          users: recipients,
          template: template.broadcast,
          subject: data.subject,
          context: { body: data.message },
        },
        delay,
      );

      return { ...save_data, sendTo: recipients.length };
    }

    const save_sent = this.emailCenter.create({
      ...data,
      status: EmailStatus.sent,
    });

    const save_data = await this.emailCenter.save(save_sent);
    this.emailJobWorker.scheduleEmail({
      emailId: save_data.id,
      users: recipients,
      template: template.broadcast,
      subject: data.subject,
      context: { body: data.message },
    });

    const returnUsers: User[] = [];
    if (create.selected && create.selected?.length > 0) {
      if (!create.selected.every((value) => isUuid(value))) {
        throw new ForbiddenException('One or more IDs are not valid ID');
      }
      const users = await this.users.find({
        where: {
          id: In(create.selected),
        },
      });

      if (users.length > 0) {
        users.map((value) => returnUsers.push(value));
      }
    }

    return {
      ...save_data,
      sendTo: recipients.length,
      selectedUser: returnUsers,
    };
  }

  findAll(query: findManyEmail): Promise<DocumentResult<EmailCenter>> {
    const { page, limit, sort, include, search, filters } = this.filter(query);

    const qb = this.emailCenter.createQueryBuilder('emailCenter');

    buildFindManyQuery(
      qb,
      'emailCenter',
      filters,
      search,
      ['subject'],
      include,
      sort,
    );

    return FindManyWrapper(qb, page, limit);
  }

  async findOne(query: findOneEmail): Promise<Document<EmailCenter>> {
    const { include, sort, ...filters } = query;

    return FindOneWrapper<EmailCenter>(this.emailCenter, {
      include,
      sort,
      filters,
    });
  }

  async update(param: paramSearch, update: updateEmail): Promise<EmailCenter> {
    const findEmail = await this.emailCenter.findOne({
      where: { id: param.id },
    });

    if (!findEmail) {
      throw new ForbiddenException('Email not found');
    }

    if (
      update.status === EmailStatus.scheduled &&
      findEmail.status !== EmailStatus.scheduled
    ) {
      if (!update.scheduleDate) {
        throw new ForbiddenException('Schedule date is not defined');
      }

      const delay = update.scheduleDate.getTime() - Date.now();

      if (delay <= 0) {
        throw new ForbiddenException('Schedule date is in the past');
      }
      const recipients = await this.recipients(
        update.recipient,
        update.selected,
      );

      this.emailJobWorker.scheduleDelayedEmail(
        {
          emailId: findEmail.id,
          users: recipients,
          template: template.broadcast,
          subject: update.subject ?? findEmail.subject,
          context: { body: update.message ?? findEmail.message },
        },
        delay,
      );

      await this.emailCenter.update(param, update);
      return findEmail;
    }

    await this.emailCenter.update(param, update);
    return findEmail;
  }

  remove(param: paramSearch) {
    return this.emailCenter.delete(param.id);
  }

  private async recipients(
    recipient: EmailRecipient | undefined,
    selected: string[] | undefined,
  ) {
    const receiver: { email: string; fullName: string }[] = [];

    if (recipient === EmailRecipient.copiers) {
      const Copiers = await this.users.find({ where: { role: Role.follower } });
      if (Copiers.length > 0) {
        Copiers.map((value) =>
          receiver.push({
            email: value.email,
            fullName: value.fullName,
          }),
        );
      }
    }

    if (recipient === EmailRecipient.pro) {
      const Pro = await this.users.find({ where: { role: Role.pro } });
      if (Pro.length > 0) {
        Pro.map((value) =>
          receiver.push({
            email: value.email,
            fullName: value.fullName,
          }),
        );
      }
    }

    if (recipient === EmailRecipient.users) {
      const users = await this.users.find({
        where: { role: Not(Role.admin) },
      });
      if (users.length > 0) {
        users.map((value) =>
          receiver.push({
            email: value.email,
            fullName: value.fullName,
          }),
        );
      }
    }

    if (selected && selected?.length > 0) {
      if (!selected.every((value) => isUuid(value))) {
        throw new ForbiddenException('One or more IDs are not valid ID');
      }
      const users = await this.users.find({
        where: {
          id: In(selected),
        },
      });

      if (users.length > 0) {
        users.map((value) =>
          receiver.push({
            email: value.email,
            fullName: value.fullName,
          }),
        );
      }
    }

    return receiver;
  }

  private filter(query: findManyEmail) {
    const { page, limit, sort, include, search, ...rest } = query;

    let filters: Record<string, any> = {};

    if (rest.clickRate) {
      filters = { clickRate: rest.clickRate };
    }

    if (rest.openRate) {
      filters = { openRate: rest.openRate };
    }

    if (rest.recipient) {
      filters = { recipient: rest.recipient };
    }

    if (rest.scheduleDate) {
      filters = { scheduleDate: rest.scheduleDate };
    }

    if (rest.status) {
      filters = { status: rest.status };
    }

    return { page, limit, sort, include, search, filters };
  }
}
