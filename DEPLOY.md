# 部署說明

## 1. 上傳到伺服器

```bash
scp -r fitness-site user@your-server-ip:/home/user/
```

或用 git：
```bash
git init && git add . && git commit -m "init"
git push your-server...
```

## 2. 伺服器上安裝 Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# 重新登入讓群組生效
```

## 3. 設定環境變數

```bash
cd fitness-site
cp .env .env.local  # 備份後編輯
nano .env
```

填入：
```
POSTGRES_PASSWORD=你的資料庫密碼（隨機強密碼）
NEXTAUTH_SECRET=你的JWT密鑰（32字元以上隨機字串）
NEXTAUTH_URL=http://你的網域.com
ADMIN_PASSWORD=你的後台登入密碼
```

產生隨機字串：`openssl rand -base64 32`

## 4. 啟動

```bash
docker compose up -d --build
```

第一次會比較久（下載 image、安裝套件、build）。

## 5. 確認運作

```bash
docker compose logs -f app    # 查看 Next.js log
docker compose ps             # 確認所有服務都是 Up
```

## 6. Cloudflare 設定

1. Cloudflare DNS → 新增 A record：`@` 指向你的伺服器 IP
2. Proxy status: Proxied（橘色雲朵）
3. SSL/TLS → 選 **Flexible**（Cloudflare 幫你處理 HTTPS）

之後訪問 `https://你的網域.com` 就會有 HTTPS 了。

## 常用指令

```bash
# 重啟
docker compose restart app

# 更新程式碼後重新部署
docker compose up -d --build app

# 查看 log
docker compose logs -f

# 進入資料庫
docker compose exec db psql -U postgres -d fitness
```

## 後台登入

訪問 `https://你的網域.com/admin`，輸入 `.env` 裡設定的 `ADMIN_PASSWORD`。
