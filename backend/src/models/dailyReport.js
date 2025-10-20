export default (sequelize, DataTypes) => {
  const DailyReport = sequelize.define(
    "DailyReport",
    {
      report_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      date: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
      total_products_in: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      total_products_out: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      generated_by: { type: DataTypes.STRING(128), allowNull: false },
      generated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    },
    { tableName: "daily_report", timestamps: false, freezeTableName: true }
  );
  return DailyReport;
};
