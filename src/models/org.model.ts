import { Entity } from './base.model';
import { UserModel } from './user.models';

export interface OrgModel extends Entity {
  name: string;
  description?: string;
  logoUrl?: string;
  orgCode: string;
  parentOrgCode?: string | undefined;
  parentOrg?: OrgModel | undefined;
  officers?: UserModel[] | undefined;
  members?: UserModel[] | undefined;
}
