import type {SessionUser} from "@/types/auth";

/** Temporary account-free workspace. Set true to restore account features. */
export const AUTH_ENABLED:boolean=false;
/** Local storage namespace only; never a database user or an authenticated identity. */
export const guestWorkspaceUser:SessionUser={id:"guest-workspace-v1",email:"",username:"guest",firstName:"ผู้เยี่ยมชม",lastName:"",role:"MEMBER"};
