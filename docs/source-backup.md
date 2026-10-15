# 源码备份

GitHub：<https://github.com/purryc/mobile-input>（按用户 2026-10-08 的要求使用公开仓库）。Google Drive 源码 ZIP 放在现有 TEMP 文件夹，沿用文件夹原有访问权限。备份仅在用户要求时推送。

源码包含 Web、HarmonyOS 两端、共享协议、测试、可编辑样例、已审核运行素材、第三方源码、文档、设计脚本和依赖锁文件。原始录屏、私有截图、签名凭据、安装依赖、构建缓存和产物不进入备份。真机 HAP 需在恢复环境重新配置本机签名；构建方式见 `build-install.md`。

每次归档从已提交的 Git 快照生成，使 ZIP 和 GitHub 对应同一版本：

```sh
mkdir -p artifacts/backup
backup_date=$(date +%F)
backup_commit=$(git rev-parse --short=8 HEAD)
git archive --format=zip --prefix=mobile-input/ --output="artifacts/backup/mobile-input-source-${backup_date}-${backup_commit}.zip" HEAD
```

上传前检查 ZIP 完整性及排除项，记录完整提交编号、SHA-256、MD5、文件数和大小。上传后核对 GitHub `main` 提交以及 Drive 文件所在目录、大小和可用校验和。回执保留在 `artifacts/backup/`，不进入源码。

恢复：克隆仓库或解压 ZIP，然后执行 `npm ci`。浏览器运行、两端构建和设备安装步骤见项目 `README.md` 与 `docs/build-install.md`。

## 2026-10-14 同步范围

用户要求记录今日进展并完整同步 GitHub。仓库从已发布的 1.2.0（`df71727`）补齐至本地 1.4.0，包含文件浏览器、通用输入、绘画、Bilibili、真实文字润色及可编辑设计脚本。进展与验收索引见 [开发日报](development-progress-2026-10-14.md)。

签名 HAP、原生账号授权、用户运行状态和原始录屏／截图留在本机。仓库保存恢复与重建所需的源码、依赖锁、已审核运行素材、销售样例和构建说明；Figma 云端文件通过节点链接与迁移脚本追溯，不宣称已导出 `.fig`。此次只同步 GitHub，未上传 Drive。最终提交、远端核对和归档校验和保存在忽略目录 `artifacts/backup/`。
