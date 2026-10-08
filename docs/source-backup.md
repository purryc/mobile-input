# 源码备份

GitHub：<https://github.com/purryc/mobile-input>（私有仓库）。Google Drive 源码 ZIP 放在现有 TEMP 文件夹。备份仅在用户要求时推送。

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
