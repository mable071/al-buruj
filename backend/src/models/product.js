export default (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      product_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_name: { type: DataTypes.STRING(150), allowNull: false, unique: true },
      unit: { type: DataTypes.STRING(32), allowNull: true },
      description: { type: DataTypes.STRING(512), allowNull: true },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      date_added: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      tableName: "products",
      timestamps: false,
      freezeTableName: true,
    }
  );
  return Product;
};
