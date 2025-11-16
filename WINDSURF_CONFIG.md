# Windsurf IDE 配置文件详情

## 📍 核心存储位置

### SQLite 数据库
```bash
~/Library/Application Support/Windsurf/User/globalStorage/state.vscdb
```

### 全局配置文件
```bash
~/Library/Application Support/Windsurf/User/globalStorage/storage.json
```

### 主机器ID文件
```bash
~/Library/Application Support/Windsurf/machineid
```

---

## 🔑 设备ID列表

### 1. 主机器ID (最重要)
```
37b0b899-8fd1-4b37-9502-d22d93589f90
```
**位置**: `~/Library/Application Support/Windsurf/machineid`

**读取命令**:
```bash
cat ~/Library/Application\ Support/Windsurf/machineid
```

**写入命令**:
```bash
echo "新的UUID" > ~/Library/Application\ Support/Windsurf/machineid
```

---

### 2. 遥测机器ID
```
e3d3681705ad430e7bb6afa9752284d529fbae59a6e4cc63ce927828a7f179df
```
**位置**: `storage.json` → `telemetry.machineId`

**读取命令**:
```bash
cat ~/Library/Application\ Support/Windsurf/User/globalStorage/storage.json | python3 -c "import sys, json; print(json.load(sys.stdin)['telemetry.machineId'])"
```

---

### 3. SQM ID
```
{8C8072FE-DC89-4B34-8B1E-5EC77838A934}
```
**位置**: `storage.json` → `telemetry.sqmId`

---

### 4. 开发设备ID
```
7c6b44bb-f9d1-4d74-98c0-079139ac7649
```
**位置**: `storage.json` → `telemetry.devDeviceId`

---

### 5. 服务机器ID
```
721b1e7f-11ab-45af-a990-c826e50acf1a
```
**位置**: `state.vscdb` → `storage.serviceMachineId`

**读取命令**:
```bash
sqlite3 ~/Library/Application\ Support/Windsurf/User/globalStorage/state.vscdb \
  "SELECT value FROM ItemTable WHERE key = 'storage.serviceMachineId'"
```

---

## 🔐 认证信息

### 当前登录账号 (windsurfAuthStatus)

**读取命令**:
```bash
sqlite3 ~/Library/Application\ Support/Windsurf/User/globalStorage/state.vscdb \
  "SELECT value FROM ItemTable WHERE key = 'windsurfAuthStatus'"
```

**JSON 结构**:
```json
{
  "name": "kaa aax",
  "apiKey": "sk-ws-01-4BcSVOrYzySJ3j513pb6Pf3AlXUJy3yGVTwq9jypFDgJ2W0MMAkLHBYWfLymaM8tVOMYIy9qSeGq_8dLwMiiU6mW941BRg",
  "email": "1po22z0j618@yians.cn",
  "teamId": "1f5c1164-d66a-424f-abea-ccac0cc8e05a",
  "planName": "Pro"
}
```

**写入命令**:
```bash
sqlite3 ~/Library/Application\ Support/Windsurf/User/globalStorage/state.vscdb \
  "INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('windsurfAuthStatus', '你的JSON字符串')"
```

---

### 账号池配置 (mypool.windsurf-account-pool)

**读取命令**:
```bash
sqlite3 ~/Library/Application\ Support/Windsurf/User/globalStorage/state.vscdb \
  "SELECT value FROM ItemTable WHERE key = 'mypool.windsurf-account-pool'"
```

**包含信息**:
- 当前账号邮箱
- Firebase token
- Access token
- Refresh token
- 套餐信息
- 可用额度

---

## 📊 数据库结构

### ItemTable 表结构
```sql
CREATE TABLE ItemTable (
  key TEXT PRIMARY KEY,
  value BLOB
);
```

### 关键字段列表
```bash
# 查看所有认证相关的 key
sqlite3 ~/Library/Application\ Support/Windsurf/User/globalStorage/state.vscdb \
  "SELECT key FROM ItemTable WHERE key LIKE '%auth%' OR key LIKE '%windsurf%'"
```

**输出**:
```
codeium.windsurf
codeium.windsurf-windsurf_auth
windsurfAuthStatus
windsurfChangelog/lastVersion
windsurfConfigurations
windsurfCustomAppIcon
windsurfOnboarding
windsurfProductEducation
windsurf_auth-kaa aax
windsurf_auth-kaa aax-usages
mypool.windsurf-account-pool
```

---

## 🛠️ 常用操作命令

### 1. 备份所有配置
```bash
# 备份数据库
cp ~/Library/Application\ Support/Windsurf/User/globalStorage/state.vscdb \
   ~/Desktop/windsurf_backup_$(date +%Y%m%d_%H%M%S).db

# 备份配置文件
cp ~/Library/Application\ Support/Windsurf/User/globalStorage/storage.json \
   ~/Desktop/storage_backup_$(date +%Y%m%d_%H%M%S).json

# 备份机器ID
cp ~/Library/Application\ Support/Windsurf/machineid \
   ~/Desktop/machineid_backup_$(date +%Y%m%d_%H%M%S).txt
```

---

### 2. 修改机器ID
```bash
# 生成新的 UUID
NEW_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]')

# 写入新的机器ID
echo $NEW_UUID > ~/Library/Application\ Support/Windsurf/machineid

# 验证
cat ~/Library/Application\ Support/Windsurf/machineid
```

---

### 3. 查看所有设备ID
```bash
echo "=== 主机器ID ==="
cat ~/Library/Application\ Support/Windsurf/machineid

echo -e "\n=== 遥测机器ID ==="
cat ~/Library/Application\ Support/Windsurf/User/globalStorage/storage.json | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print('telemetry.machineId:', data.get('telemetry.machineId')); print('telemetry.sqmId:', data.get('telemetry.sqmId')); print('telemetry.devDeviceId:', data.get('telemetry.devDeviceId'))"

echo -e "\n=== 服务机器ID ==="
sqlite3 ~/Library/Application\ Support/Windsurf/User/globalStorage/state.vscdb \
  "SELECT value FROM ItemTable WHERE key = 'storage.serviceMachineId'"
```

---

### 4. 导出认证信息
```bash
# 导出为 JSON 文件
sqlite3 ~/Library/Application\ Support/Windsurf/User/globalStorage/state.vscdb \
  "SELECT value FROM ItemTable WHERE key = 'windsurfAuthStatus'" | \
  python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2))" \
  > ~/Desktop/windsurf_auth.json
```

---

### 5. 写入新的认证信息
```bash
# 准备 JSON 数据
AUTH_JSON='{"name":"test","apiKey":"sk-xxx","email":"test@example.com","teamId":"xxx"}'

# 写入数据库
sqlite3 ~/Library/Application\ Support/Windsurf/User/globalStorage/state.vscdb \
  "INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('windsurfAuthStatus', '$AUTH_JSON')"
```

---

### 6. 批量修改所有设备ID
```bash
#!/bin/bash

# 生成新的 UUID
NEW_MACHINE_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
NEW_TELEMETRY_ID=$(openssl rand -hex 32)
NEW_SQM_ID=$(uuidgen)
NEW_DEV_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
NEW_SERVICE_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

# 修改主机器ID
echo $NEW_MACHINE_ID > ~/Library/Application\ Support/Windsurf/machineid

# 修改 storage.json 中的ID (需要使用 jq 工具)
jq --arg mid "$NEW_TELEMETRY_ID" \
   --arg sqm "{$NEW_SQM_ID}" \
   --arg dev "$NEW_DEV_ID" \
   '.["telemetry.machineId"] = $mid | .["telemetry.sqmId"] = $sqm | .["telemetry.devDeviceId"] = $dev' \
   ~/Library/Application\ Support/Windsurf/User/globalStorage/storage.json \
   > /tmp/storage_new.json && \
   mv /tmp/storage_new.json ~/Library/Application\ Support/Windsurf/User/globalStorage/storage.json

# 修改服务机器ID
sqlite3 ~/Library/Application\ Support/Windsurf/User/globalStorage/state.vscdb \
  "INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('storage.serviceMachineId', '$NEW_SERVICE_ID')"

echo "所有设备ID已更新！"
```

---

## ⚠️ 注意事项

1. **修改前务必备份** - 所有操作前先备份原始文件
2. **关闭 Windsurf** - 修改配置时确保应用已完全关闭
3. **UUID 格式** - 保持标准 UUID 格式 (小写，带连字符)
4. **权限问题** - 某些操作可能需要管理员权限
5. **测试验证** - 修改后启动应用验证是否正常工作

---

## 📦 完整备份脚本

```bash
#!/bin/bash

# 创建备份目录
BACKUP_DIR=~/Desktop/windsurf_backup_$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
cp ~/Library/Application\ Support/Windsurf/User/globalStorage/state.vscdb \
   $BACKUP_DIR/state.vscdb

# 备份配置文件
cp ~/Library/Application\ Support/Windsurf/User/globalStorage/storage.json \
   $BACKUP_DIR/storage.json

# 备份机器ID
cp ~/Library/Application\ Support/Windsurf/machineid \
   $BACKUP_DIR/machineid

# 导出认证信息
sqlite3 ~/Library/Application\ Support/Windsurf/User/globalStorage/state.vscdb \
  "SELECT key, value FROM ItemTable WHERE key LIKE '%auth%' OR key LIKE '%windsurf%'" \
  > $BACKUP_DIR/auth_keys.txt

echo "备份完成: $BACKUP_DIR"
```

---

## 🔄 恢复脚本

```bash
#!/bin/bash

# 指定备份目录
BACKUP_DIR="~/Desktop/windsurf_backup_XXXXXX"

# 关闭 Windsurf (如果正在运行)
killall Windsurf 2>/dev/null

# 恢复数据库
cp $BACKUP_DIR/state.vscdb \
   ~/Library/Application\ Support/Windsurf/User/globalStorage/state.vscdb

# 恢复配置文件
cp $BACKUP_DIR/storage.json \
   ~/Library/Application\ Support/Windsurf/User/globalStorage/storage.json

# 恢复机器ID
cp $BACKUP_DIR/machineid \
   ~/Library/Application\ Support/Windsurf/machineid

echo "恢复完成！"
```

---

## 📚 相关文档

- [Windsurf 官方文档](https://windsurf.com)
- [SQLite 命令参考](https://www.sqlite.org/cli.html)
- [UUID 生成工具](https://www.uuidgenerator.net/)

---

**最后更新**: 2025-11-15
**版本**: 1.0.0
