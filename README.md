# hotspot-hub

热点聚合与洞察面板，基于 Next.js、NextAuth、Prisma 和多源热点采集。

## 本地配置

复制 `.env.example` 为 `.env.local`，按本机服务填写数据库、认证和可选 AI/翻译配置。`.env*` 已被 Git 忽略，不要提交真实密钥。

```bash
cp .env.example .env.local
```

## 开发

```bash
npm install
npm run dev
```

默认开发端口是 [http://localhost:31000](http://localhost:31000)。

## 验证

```bash
npm run lint
npm run build
```

测试文件可直接用 Node 测试运行器执行：

```bash
node --experimental-strip-types --test "tests/**/*.test.ts"
```
