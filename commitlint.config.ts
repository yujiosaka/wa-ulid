module.exports = {
  extends: ["@commitlint/config-conventional"],
  ignores: [(message: string) => message.startsWith("chore(release):")],
};
