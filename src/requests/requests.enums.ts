export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  IN_PROGRESS = 'inProgress',
  DONE = 'done',
}

export const RequestStatusApi = {
  enum: Object.values(RequestStatus),
  example: RequestStatus.PENDING,
};