import os
import pathlib
import re
from html import unescape

BASE = pathlib.Path("stitch_mcp_talent_orchestrator")
OUTPUT_BASE = pathlib.Path("app/stitch_mcp_talent_orchestrator")

VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}

CSS_VAR_NAMES = [
    "background", "on-surface", "surface", "surface-container", "surface-container-low", "surface-container-high", "surface-container-highest",
    "surface-container-lowest", "surface-dim", "surface-bright", "surface-variant", "surface-tint",
    "primary", "on-primary", "primary-container", "on-primary-container", "primary-fixed", "primary-fixed-dim", "primary-fixed-variant", "inverse-primary",
    "secondary", "secondary-container", "secondary-fixed", "secondary-fixed-dim", "on-secondary", "on-secondary-container", "on-secondary-fixed", "on-secondary-fixed-variant",
    "tertiary", "tertiary-container", "tertiary-fixed", "tertiary-fixed-dim", "on-tertiary", "on-tertiary-container", "on-tertiary-fixed", "on-tertiary-fixed-variant",
    "error", "error-container", "on-error", "on-error-container", "outline", "outline-variant", "inverse-on-surface", "on-background", "on-surface-variant",
]


def slugify_folder_name(name: str) -> str:
    return (
        name.strip()
            .replace(" ", "-")
            .replace("%", "")
            .replace("#", "")
            .replace("?", "")
            .replace("&", "")
            .replace("@", "")
            .replace("!", "")
            .replace("$", "")
            .replace("(", "")
            .replace(")", "")
            .replace("+", "plus")
            .replace("=", "")
            .replace(",", "")
            .replace("`", "")
            .replace("~", "")
            .replace("*", "")
            .replace(";", "")
            .replace(":", "")
            .replace('"', "")
            .replace("'", "")
    )


def extract_between(text: str, start: str, end: str) -> str:
    a = text.find(start)
    if a == -1:
        return ""
    b = text.find(end, a + len(start))
    if b == -1:
        return text[a + len(start) :]
    return text[a + len(start) : b]


def css_to_jsx_style(style: str) -> str:
    declarations = [decl.strip() for decl in style.split(";") if decl.strip()]
    props = []
    for decl in declarations:
        if ":" not in decl:
            continue
        key, value = decl.split(":", 1)
        key = key.strip()
        value = value.strip()
        key = re.sub(r"-(\w)", lambda m: m.group(1).upper(), key)
        value = value.replace("\"", "\\\"")
        props.append(f"{key}: \"{value}\"")
    return ", ".join(props)


ATTRIBUTE_MAP = {
    "class": "className",
    "for": "htmlFor",
    "tabindex": "tabIndex",
    "autofocus": "autoFocus",
    "readonly": "readOnly",
    "spellcheck": "spellCheck",
    "contenteditable": "contentEditable",
    "crossorigin": "crossOrigin",
    "referrerpolicy": "referrerPolicy",
    "allowfullscreen": "allowFullScreen",
    "maxlength": "maxLength",
    "minlength": "minLength",
    "autocomplete": "autoComplete",
    "novalidate": "noValidate",
    "srcset": "srcSet",
    "viewbox": "viewBox",
    "preserveaspectratio": "preserveAspectRatio",
}

BOOLEAN_ATTRIBUTES = {
    "checked",
    "disabled",
    "readonly",
    "required",
    "selected",
    "multiple",
    "autofocus",
    "open",
    "hidden",
}


def html_attribute_to_jsx(name: str) -> str:
    lower = name.lower()
    if lower in ATTRIBUTE_MAP:
        return ATTRIBUTE_MAP[lower]
    if lower.startswith("on"):
        return "on" + name[2:].capitalize()
    if lower.startswith("data-") or lower.startswith("aria-") or name.startswith("xml:") or name.startswith("xmlns"):
        return name
    if "-" in name:
        return re.sub(r"-([a-zA-Z])", lambda m: m.group(1).upper(), name)
    return name


def convert_html_to_jsx(html: str) -> str:
    html = unescape(html)
    html = re.sub(r"<!--([\s\S]*?)-->", "", html)

    def convert_style(match):
        inner = match.group(1)
        jsx_style = css_to_jsx_style(inner)
        return f"style={{ {{ {jsx_style} }} }}"

    html = re.sub(r"style=\"([^\"]*)\"", convert_style, html)
    html = re.sub(r"style='([^']*)'", convert_style, html)

    for html_name, jsx_name in ATTRIBUTE_MAP.items():
        html = re.sub(rf"\b{re.escape(html_name)}=", f"{jsx_name}=", html, flags=re.IGNORECASE)

    html = re.sub(r"\b(on[a-zA-Z]+)=", lambda m: html_attribute_to_jsx(m.group(1)) + "=", html)
    html = re.sub(r"\b([a-z][a-z0-9-]+)=(?=[\"'])", lambda m: html_attribute_to_jsx(m.group(1)) + "=", html)

    html = re.sub(r"\bchecked\b", "checked={true}", html)
    html = re.sub(r"\bdisabled\b", "disabled={true}", html)
    html = re.sub(r"\breadonly\b", "readOnly", html)
    html = re.sub(r"\bautofocus\b", "autoFocus", html)
    html = re.sub(r"\bmultiple\b", "multiple={true}", html)
    html = re.sub(r"\bselected\b", "selected={true}", html)
    html = re.sub(r"\brequired\b", "required={true}", html)

    for tag in VOID_TAGS:
        html = re.sub(rf"<({tag})([^>/]*?)>(?!</{tag}>)", r"<\1\2 />", html, flags=re.IGNORECASE)

    html = html.replace("className=\"\"", "")
    return html


def normalize_style_block(style: str) -> str:
    style = style.replace("html, body", ".mcp-orchestra-root")
    style = re.sub(r"(^|\n)body\s*\{", r"\1.mcp-orchestra-root {", style)
    style = re.sub(r"(^|\n)html\s*\{", r"\1.mcp-orchestra-root {", style)
    style = re.sub(r"(^|\n)([^\n{}]*?)\.custom-scrollbar", r"\1.mcp-orchestra-root .custom-scrollbar", style)
    style = re.sub(r"(^|\n)([^\n{}]*?)(::-webkit-scrollbar[^\n{]*)", r"\1.mcp-orchestra-root \2\3", style)
    style = style.replace("\r", "")
    return style


def strip_wrapper_script(script: str) -> str:
    script = script.strip()
    if script.startswith("window.onload = () => {") and script.endswith("};"):
        return script[len("window.onload = () => {") : -2].strip()
    if script.startswith("window.onload = function() {") and script.endswith("};"):
        return script[len("window.onload = function() {") : -2].strip()
    if script.startswith("document.addEventListener('DOMContentLoaded', () => {") and script.endswith("});"):
        return script[len("document.addEventListener('DOMContentLoaded', () => {") : -3].strip()
    if script.startswith('document.addEventListener("DOMContentLoaded", () => {') and script.endswith("});"):
        return script[len('document.addEventListener("DOMContentLoaded", () => {') : -3].strip()
    return script


def render_page_template(title: str, body_class: str, jsx_body: str, styles: str, has_chart: bool, script_content: str, css_vars: dict) -> str:
    imports = ["'use client'"]
    if script_content or has_chart:
        imports.append("import { useEffect } from 'react'")
    import_lines = "\n".join(imports)
    chart_import = "import { Chart, registerables } from 'chart.js';\n" if has_chart else ""
    chart_register = "    Chart.register(...registerables);\n" if has_chart else ""
    effect_open = "\n    useEffect(() => {\n" if script_content or has_chart else ""
    effect_body = ""
    if chart_import and not script_content:
        effect_body = ""
    if script_content:
        effect_body = strip_wrapper_script(script_content)
    use_effect = ""
    if script_content or has_chart:
        use_effect = effect_open + chart_register + effect_body + "\n    }, []);\n"

    css_vars_style = ""
    if css_vars:
        css_vars_string = "; ".join([f"--{key}: {value}" for key, value in css_vars.items()])
        css_vars_style = f" style={{ {{ {css_vars_string} }} }}"

    title_safe = title.replace("'", "\\'")
    template = (
        import_lines
        + "\n"
        + chart_import
        + f"export const metadata = {{ title: '{title_safe}' }};\n\n"
        + "export default function Page() {\n"
        + (use_effect if use_effect else "")
        + "    return (\n"
        + f"        <div className=\"mcp-orchestra-root {body_class}\"{css_vars_style}>\n"
        + jsx_body
        + "\n            <style jsx global>{`\n"
        + styles
        + "\n            `}<\/style>\n"
        + "        </div>\n"
        + "    );\n"
        + "}\n"
    )
    return template


def collect_css_vars(style: str) -> dict:
    vars = {}
    for name in CSS_VAR_NAMES:
        pattern = re.compile(rf"--{name}:\s*([^;\n]+);?")
        match = pattern.search(style)
        if match:
            vars[name] = match.group(1).strip()
    return vars


def generate_pages():
    if not OUTPUT_BASE.exists():
        OUTPUT_BASE.mkdir(parents=True)
    pages = []
    for root, dirs, files in os.walk(BASE):
        rel_root = pathlib.Path(root).relative_to(BASE)
        sanitized_parts = [slugify_folder_name(part) for part in rel_root.parts if part]
        output_dir = OUTPUT_BASE.joinpath(*sanitized_parts)
        if not output_dir.exists():
            output_dir.mkdir(parents=True, exist_ok=True)
        for file_name in files:
            if file_name.lower() != "code.html":
                continue
            source_path = pathlib.Path(root) / file_name
            html_text = source_path.read_text(encoding="utf-8")
            body_match = re.search(r"<body\b([^>]*)>([\s\S]*?)</body>", html_text, flags=re.IGNORECASE)
            body_attrs = body_match.group(1) if body_match else ""
            body_inner = body_match.group(2) if body_match else html_text
            body_class_match = re.search(r'class=["\']([^"\']+)["\']', body_attrs, flags=re.IGNORECASE)
            body_class = body_class_match.group(1) if body_class_match else ""
            head_match = re.search(r"<head[^>]*>([\s\S]*?)</head>", html_text, flags=re.IGNORECASE)
            head_text = head_match.group(1) if head_match else ""
            styles = "\n".join(re.findall(r"<style[^>]*>([\s\S]*?)</style>", head_text, flags=re.IGNORECASE))
            styles = normalize_style_block(styles)
            css_vars = collect_css_vars(styles)
            script_texts = re.findall(r"<script[^>]*>([\s\S]*?)</script>", head_text + body_inner, flags=re.IGNORECASE)
            script_texts = [s for s in script_texts if s.strip() and "tailwind.config" not in s]
            external_scripts = re.findall(r"<script[^>]*src=[\"']([^\"']+)[\"'][^>]*>\s*</script>", head_text + body_inner)
            has_chart = any("chart.js" in src.lower() for src in external_scripts)
            body_inner = re.sub(r"</?html[^>]*>", "", body_inner, flags=re.IGNORECASE)
            body_inner = re.sub(r"</?head[^>]*>", "", body_inner, flags=re.IGNORECASE)
            jsx_body = convert_html_to_jsx(body_inner.strip())
            script_content = "\n".join(script_texts)
            title = extract_between(head_text, "<title>", "</title>").strip() or "Stitch MCP Talent Orchestra"
            page_file = output_dir / "page.tsx"
            page_code = render_page_template(title, body_class, jsx_body, styles, has_chart, script_content, css_vars)
            page_file.write_text(page_code, encoding="utf-8")
            pages.append((sanitized_parts, title, output_dir))
    return pages


if __name__ == "__main__":
    pages = generate_pages()
    print(f"Generated {len(pages)} pages")
