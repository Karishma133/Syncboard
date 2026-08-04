// owner => full access, member => read/write, delete & member-management => owner only
const hasPermission = (board, userId, action) => {
  const isOwner = board.owner.toString() === userId.toString();
  const isMember = board.members.some((m) => m.toString() === userId.toString());

  if (!isOwner && !isMember) return false;

  const ownerOnlyActions = ["delete", "manage-members", "manage-labels"];
  if (ownerOnlyActions.includes(action) && !isOwner) return false;

  return true;
};

export { hasPermission };
