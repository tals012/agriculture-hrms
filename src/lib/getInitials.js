export const getInitials = (name) => {
  const parts = name.split(" ");
  const initials = parts.map((part) => part[0]).join("");
  return initials.toUpperCase();
};
