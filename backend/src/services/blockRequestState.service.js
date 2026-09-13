import BlockRequest from "../models/BlockRequest.js";

export const POPULATE = [
  { path: "department", select: "name code" },
  { path: "requestedBy", select: "name email" },
  { path: "section", select: "name corridorId" },
];

// Atomically moves a BlockRequest out of one of `fromStatuses` with a
// single conditional MongoDB write (`status` is part of the filter, not
// just checked beforehand). Returns the updated document if THIS call
// performed the transition, or `null` if the document was no longer in
// one of `fromStatuses` when the write ran - e.g. a concurrent request
// (double-click, retry, duplicate submit) already transitioned it.
//
// This is the single mechanism every lifecycle transition (submit,
// approve, reject, fail) goes through so that audit entries,
// notifications, and Intelligence Service calls can be gated on "did MY
// call actually cause this transition" instead of "did MY initial read
// see the old status" - the latter is racy, the former is not.
//
// Deliberately returns the RAW (unpopulated) document, matching what
// every handler here already sent back to the client before this fix.
// Every caller also feeds this straight into conflict detection /
// candidate-window queries that filter by `section`/`department` as
// plain ObjectIds - a populated `section` (a full document) does not
// match those queries the same way and silently returns zero results
// instead of erroring, which is exactly the regression this comment is
// here to stop someone reintroducing.
export async function atomicTransition(id, fromStatuses, update) {
  return BlockRequest.findOneAndUpdate({ _id: id, status: { $in: fromStatuses } }, update, {
    returnDocument: "after",
  });
}
