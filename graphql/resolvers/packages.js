const { AuthenticationError, UserInputError } = require("apollo-server");

const checkAuth = require("../../util/check-auth");
const Packs = require("../../models/Packages");

module.exports = {
  Query: {
    async getPacks() {
      try {
        const posts = await Packs.find().sort({ value: 1 });
        return posts;
      } catch (err) {
        throw new Error(err);
      }
    },
  },
  Mutation: {
    createPack: async (_, { label, value }, context) => {
      const user = checkAuth(context);
      try {
        const newPack = new Packs({
          label,
          value,
        });
        const post = await newPack.save();
        return true;
      } catch (err) {
        throw new Error(err);
      }
    },
  },
};
