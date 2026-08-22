# Image to Editable PPT

将图片化幻灯片重建为可编辑的 PowerPoint 页面。普通文本、形状、表格、图表和简单图形优先生成原生对象；复杂背景或无法可靠重建的视觉资产单独保留并注明边界。生成、SVG 库和 PPTX 检查同时支持 Windows 与 macOS。

安装 Codex Skill 只会复制文件，不会自动安装 npm/Python 依赖、下载模型、访问 Iconfont 或改动既有 SVG 库。

克隆仓库后，显式执行：

```powershell
.\scripts\setup.ps1
```

默认仅安装核心 `pptxgenjs` 到 Skill 自身的 `runtime/node_modules`。可选 OCR 或背景修复依赖需显式指定 `-WithOcr`、`-WithInpaint`。

macOS/Linux 使用：

```bash
./scripts/setup.sh
./scripts/check-env.sh
```

Windows 使用 PowerPoint COM 导出 PNG 做渲染验收；macOS 使用 LibreOffice 无界面转 PDF，安装 Poppler 后可自动输出每页 PNG。中文默认 `PingFang SC`，英文/拉丁字符保持 `Times New Roman`；如需与 Windows 完全一致，可自行安装 `Microsoft YaHei`。

不同系统的能力与 macOS 安装注意事项见 [platform support](docs/platform-support.md)。

MathType 的 Word/WPS OLE 工作流仅支持 Windows。macOS 仅保留 MathML/LaTeX 源，并嵌入 SVG/PDF 等矢量回退，不承诺公式 OLE 可编辑性。
