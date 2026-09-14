# Image to Editable PPT

将图片化幻灯片高保真重建为可编辑的 PowerPoint 页面。文本、形状、线条/连接器、表格和图表优先生成原生对象；复杂内容先拆成细粒度对象，无法可靠原生重建时只保留对应局部素材，并明确可编辑边界。嵌入 SVG 仍按图片对象报告，不冒充原生形状。

每个重建项目都应先完整浏览原图，再建立逐区域、逐元素清单，记录源图坐标、层级、角色、表现方式、PowerPoint 对象名映射、完成状态和保真核对。清单校验可以发现已登记项目中的遗漏、未映射和未声明降级，但无法发现从未登记的原图内容，因此交付前必须再次检查整页原图和复杂局部。

安装 Codex Skill 只会复制文件，不会自动安装 npm/Python 依赖、下载模型、访问 Iconfont 或改动既有 SVG 库。

克隆仓库后，在 Windows、macOS 或 Linux 均显式执行：

```bash
node scripts/setup.mjs
node scripts/check-env.mjs
```

默认仅安装核心 `pptxgenjs`、`jszip` 和轻量 OOXML 解析器 `@xmldom/xmldom` 到 Skill 自身的 `runtime/node_modules`。可选 OCR 或背景修复依赖需显式指定 `--with-ocr`、`--with-inpaint`。

Windows 使用 PowerPoint COM 导出 PNG 做渲染验收；macOS 使用 LibreOffice 无界面转 PDF，安装 Poppler 后可自动输出每页 PNG。字体按原图特征选择，不再强制 ASCII 使用 Times New Roman。必须确认实际渲染引擎可访问所选字体，并记录替代字体。

Windows 若需通过 LibreOffice 自动输出每页 PNG，可执行 `winget install --exact --id oschwartz10612.Poppler`安装 Poppler。本 Skill 会自动识别 Winget 的标准安装目录，无需等待当前终端重启后才能使用。

PowerShell 仅作为 Windows 兼容入口，或在需要 PowerPoint COM 、MathType Word/WPS 自动化时使用；普通流程不应默认调用它。

不同系统的能力与 macOS 安装注意事项见 [platform support](docs/platform-support.md)。

MathType 的 Word/WPS OLE 工作流仅支持 Windows。macOS 仅保留 MathML/LaTeX 源，并嵌入 SVG/PDF 等矢量回退，不承诺公式 OLE 可编辑性。

交付检查示例：

```bash
node skills/image-to-editable-ppt/scripts/check-manifest.mjs reconstruction-manifest.json --mode delivery
node skills/image-to-editable-ppt/scripts/inspect-ppt.mjs output.pptx --manifest reconstruction-manifest.json --mode delivery
node skills/image-to-editable-ppt/scripts/render-ppt.mjs output.pptx render-dir
python3 skills/image-to-editable-ppt/scripts/compare-renders.py source.png render-dir/slide-1.png comparison-dir --manifest reconstruction-manifest.json --slide 1
```

图像比对会保留整页原图与渲染图、并排图、半透明叠加图、差异图和清单区域裁切，同时记录文件路径与 SHA-256。相似度数值只作辅助，不使用未经校准的固定门槛代替关键区域验收。
