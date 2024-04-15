import { destroySession, getPocketbase } from "~/utils/pb.server";

export function loader() {
  const pb = getPocketbase();
  return destroySession(pb);
}
