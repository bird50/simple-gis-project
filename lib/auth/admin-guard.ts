type AccountState={role:"MEMBER"|"ADMIN";status:"ACTIVE"|"INACTIVE"|"SUSPENDED"};

/** True when a change takes an active administrator out of the active-admin set (demotion or deactivation). */
export function removesActiveAdmin(target:AccountState,change:Partial<AccountState>){
  if(target.role!=="ADMIN"||target.status!=="ACTIVE")return false;
  return (change.role!==undefined&&change.role!=="ADMIN")||(change.status!==undefined&&change.status!=="ACTIVE");
}
