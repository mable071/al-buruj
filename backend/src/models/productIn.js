export default (sequelize, DataTypes) => {
  const ProductIn = sequelize.define(
    "ProductIn",
    {
      ProductInID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ProductID: { type: DataTypes.INTEGER, allowNull: false },
      QuantityIn: { type: DataTypes.INTEGER, allowNull: false },
      supplier: { type: DataTypes.STRING(255), allowNull: true },
      DateIn: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      comment: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: "product_in",
      timestamps: false,
      freezeTableName: true,
    }
  );
  return ProductIn;
};
