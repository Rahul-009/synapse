export const getCurrentUser = (req, res) => {
  const { id, name, email } = req.user;
  res.json({ user: { id, name, email } });
};
