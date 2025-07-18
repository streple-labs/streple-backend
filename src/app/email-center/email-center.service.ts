import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document, DocumentResult, paramSearch } from 'src/global/common';
import {
  buildFindManyQuery,
  FindManyWrapper,
  FindOneWrapper,
} from 'src/global/helpers';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
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
export const QUEUE_NAME = 'send-email';
@Injectable()
export class EmailCenterService {
  constructor(
    @InjectRepository(EmailCenter)
    private readonly emailCenter: Repository<EmailCenter>,
    @InjectRepository(User) private readonly users: Repository<User>,
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
      this.emailJobWorker.scheduleDelayedEmail(
        {
          users: recipients,
          template: template.broadcast,
          subject: data.subject,
          context: { body: data.message },
        },
        delay,
      );

      return this.emailCenter.save(save_schedule);
    }

    const save_sent = this.emailCenter.create({
      ...data,
      status: EmailStatus.sent,
    });

    this.emailJobWorker.scheduleEmail({
      users: recipients,
      template: template.broadcast,
      subject: data.subject,
      context: { body: data.message },
    });
    return this.emailCenter.save(save_sent);
  }

  findAll(query: findManyEmail): Promise<DocumentResult<EmailCenter>> {
    const { page, limit, sort, include, search, filters } = this.filter(query);

    const qb = this.emailCenter.createQueryBuilder('emailCenter');

    buildFindManyQuery(
      qb,
      'emailCenter',
      filters,
      search,
      ['subject', 'status'],
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

    await this.emailCenter.update(param.id, update);
    return findEmail;
  }

  remove(param: paramSearch) {
    return this.emailCenter.delete(param.id);
  }

  private async recipients(recipient: EmailRecipient, selected: string[]) {
    const receiver: { email: string; fullName: string }[] = [];

    if (recipient === EmailRecipient.copiers) {
      const Copiers = await this.users.find({});
      console.log({ Copiers });
      receiver.push({
        email: 'olaniyanmutiu96@gmail.com',
        fullName: 'Olaniyan',
      });
    }

    if (recipient === EmailRecipient.pro) {
      const Pro = await this.users.find({});
      console.log({ Pro });
      receiver.push({
        email: 'olaniyanmutiu96@gmail.com',
        fullName: 'Olaniyan',
      });
    }

    if (recipient === EmailRecipient.users) {
      const AllUser = await this.users.find({});
      console.log({ AllUser });
      receiver.push({
        email: 'olaniyanmutiu96@gmail.com',
        fullName: 'Olaniyan',
      });
    }

    if (selected?.length > 0) {
      const Copiers = await this.users.find({});
      console.log({ Copiers });
      receiver.push({
        email: 'olaniyanmutiu96@gmail.com',
        fullName: 'Example',
      });
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
