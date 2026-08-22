# Image to Editable PPT

将图片化幻灯片重建为可编辑的 PowerPoint 页面。普通文本、形状、表格、图表和简单图形优先生成原生对象；复杂背景或无法可靠重建的视觉资产单独保留并注明边界。

安装 Codex Skill 只会复制文件，不会自动安装 npm/Python 依赖、下载模型、访问 Iconfont 或改动既有 SVG 库。

克隆仓库后，显式执行：

```powershell
.\scripts\setup.ps1
```

默认仅安装核心 `pptxgenjs` 到 Skill 自身的 `runtime/node_modules`。可选 OCR 或背景修复依赖需显式指定 `-WithOcr`、`-WithInpaint`。
