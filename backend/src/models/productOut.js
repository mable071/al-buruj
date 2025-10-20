export default (sequelize, DataTypes) => {
  const ProductOut = sequelize.define(
    "ProductOut",
    {
      out_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity_out: { type: DataTypes.INTEGER, allowNull: false },
      date_out: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      issued_by: { type: DataTypes.STRING(128), allowNull: false },
      purpose: { type: DataTypes.STRING(256), allowNull: true },
    },
    {
      tableName: "product_out",
      timestamps: false,
      freezeTableName: true,
    }
  );
  return ProductOut;
};
