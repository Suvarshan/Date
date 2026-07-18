function createLoginController({ db, bcrypt, jwt, jwtSecret }) {
  return async function loginController(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, name: user.name },
        jwtSecret,
        { expiresIn: '2h' }
      );

      return res.json({ token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Login failed' });
    }
  };
}

module.exports = {
  createLoginController,
};
