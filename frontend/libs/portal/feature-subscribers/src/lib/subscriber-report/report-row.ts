import {
  Subscriber,
  SUBSCRIBER_STATUS,
  SUBSCRIBER_TYPE,
} from '@care/shared-data-access-api';

/** Mot dong bao cao da tinh san: template chi doc thuoc tinh, khong goi ham cho tung dong moi lan kiem tra. */
export interface ReportRow {
  id: number;
  msisdn: string;
  fullName: string;
  age: number;
  province: string;
  planCode: string;
  typeKey: string;
  statusKey: string;
  activatedAt: string;
}

export function ageOn(dateOfBirth: string, today: Date): number {
  const born = new Date(dateOfBirth);
  const age = today.getFullYear() - born.getFullYear();
  const hadBirthday =
    today.getMonth() > born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate());
  return hadBirthday ? age : age - 1;
}

export function toReportRow(s: Subscriber, today: Date): ReportRow {
  return {
    id: s.id,
    msisdn: s.msisdn,
    fullName: s.fullName,
    age: ageOn(s.dateOfBirth, today),
    province: s.province,
    planCode: s.planCode,
    typeKey: SUBSCRIBER_TYPE[s.type],
    statusKey: SUBSCRIBER_STATUS[s.status].labelKey,
    activatedAt: s.activatedAt,
  };
}
