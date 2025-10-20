import { Sequelize, DataTypes } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "mysql",
    logging: false,
    define: { timestamps: false },
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialectOptions: {
      connectTimeout: 10000, // 10 seconds
    },
  }
);

console.log( process.env.DB_NAME,process.env.DB_USER,process.env.DB_PASSWORD,process.env.DB_HOST,process.env.DB_PORT);


// Models
import ProductModel from "./product.js";
import ProductInModel from "./productIn.js";
import ProductOutModel from "./productOut.js";
import UserModel from "./user.js";
import DailyReportModel from "./dailyReport.js";

const Product = ProductModel(sequelize, DataTypes);
const ProductIn = ProductInModel(sequelize, DataTypes);
const ProductOut = ProductOutModel(sequelize, DataTypes);
const User = UserModel(sequelize, DataTypes);
const DailyReport = DailyReportModel(sequelize, DataTypes);

// Associations
Product.hasMany(ProductIn, { foreignKey: "ProductID", as: "ins" });
ProductIn.belongsTo(Product, { foreignKey: "ProductID", as: "product" });

Product.hasMany(ProductOut, { foreignKey: "product_id", as: "outs" });
ProductOut.belongsTo(Product, { foreignKey: "product_id", as: "product" });

export { sequelize, Product, ProductIn, ProductOut, User, DailyReport };
