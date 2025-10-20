export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      role: { type: DataTypes.ENUM("admin", "staff"), allowNull: false, defaultValue: "staff" },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    { tableName: "users", timestamps: false, freezeTableName: true }
  );
  return User;
};
