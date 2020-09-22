const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserInputError } = require('apollo-server');
const checkAuth = require('../../util/check-auth');
const {
  validateRegisterInput,
  validateLoginInput
} = require('../../util/validators');
const { SECRET_KEY } = require('../../config');
const User = require('../../models/User');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    },
    SECRET_KEY,
    { expiresIn: '1h' }
  );
}

module.exports = {
  Query: {
    async getCurrentUserDetailsForUpdation(_, { username }) {
      try {
        const user = await User.findOne({ username });
        if (user) {
          return user;
        } else {
          throw new Error('User not found');
        }
      } catch (err) {
        throw new Error(err);
      }
    },
    async getAllUsers() {
      try {
        const users = await User.find().sort({ createdAt: -1 });
        return users;
      } catch (err) {
        throw new Error(err);
      }
    },
    async getCurrentUserDetails(_, { userId }) {
      try {
        const user = await User.findById(userId);
        if (user) {
          return user;
        } else {
          throw new Error('user not found');
        }
      } catch (err) {
        throw new Error(err);
      }
    }
  },
  Mutation: {
    createTransaction: async (_, { userId, amount }, context) => {
      const { username } = checkAuth(context);
      if (amount.trim() === '') {
        throw new UserInputError('Empty amount', {
          errors: {
            amount: 'amount must not empty'
          }
        });
      }

      const user = await User.findById(userId);

      if (user) {
        user.transactions.unshift({
          amount,
          username,
          createdAt: new Date().toISOString()
        });
        await user.save();
        return user;
      } else throw new UserInputError('User not found');
    },
    async login(_, { username, password }) {
      const { errors, valid } = validateLoginInput(username, password);

      if (!valid) {
        throw new UserInputError('Errors', { errors });
      }

      const user = await User.findOne({ username });

      if (!user) {
        errors.username = 'User not found';
        throw new UserInputError('User not found', { errors });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        errors.password = 'Wrong crendetials';
        throw new UserInputError('Wrong crendetials', { errors });
      }

      const token = generateToken(user);

      return {
        ...user._doc,
        id: user._id,
        token
      };
    },
    async register(
      _,
      {
        registerInput: {
          username,
          email,
          password,
          confirmPassword,
          role,
          packages
        }
      }
    ) {
      // Validate user data
      const { valid, errors } = validateRegisterInput(
        username,
        email,
        password,
        confirmPassword,
        role,
        packages
      );
      if (!valid) {
        throw new UserInputError('Errors', { errors });
      }
      // TODO: Make sure user doesnt already exist
      const user = await User.findOne({ username });
      if (user) {
        throw new UserInputError('Username is taken', {
          errors: {
            username: 'This username is taken'
          }
        });
      }
      // const packageChoosen = ;
      // eslint-disable-next-line no-empty
      if (packages && packages.length) {
      } else {
        throw new UserInputError('packages', {
          errors: {
            packages: 'packages'
          }
        });
      }

      // hash password and create an auth token
      password = await bcrypt.hash(password, 12);

      const newUser = new User({
        email,
        username,
        password,
        createdAt: new Date().toISOString(),
        role,
        packages
      });

      var firstUser = await User.countDocuments();
      if (firstUser === 0) {
        newUser.role = 'SuperAdmin';
      }

      const res = await newUser.save();

      const token = generateToken(res);

      return {
        ...res._doc,
        id: res._id,
        token
      };
    }
  }
};
