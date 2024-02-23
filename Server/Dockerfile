# 使用官方Node 18映像作为构建环境
FROM node:18.17.1 as builder

# 设置工作目录
WORKDIR /usr/src/app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装应用依赖，包括开发依赖用于构建
RUN npm install

# 复制应用源代码
COPY . .

# 构建应用，编译TypeScript到JavaScript
RUN npm run build

# 使用官方Node 18映像运行应用
FROM node:18.17.1

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./

# 安装生产依赖
RUN npm install --only=production

COPY --from=builder /usr/src/app/dist ./dist

# 应用的端口
EXPOSE 3000

CMD ["node", "dist/index.js"]