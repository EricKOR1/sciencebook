#!/usr/bin/env python3
"""단원 원고 형식 점검.  사용: python3 tools/authoring/check_lesson.py [파일 …]   (파일을 주지 않으면 책 전체)"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
norm = lambda s: re.sub(r"\s+", "", s).replace("·", "⋅").replace("∙", "⋅")
CURR = ""
for f in sorted(os.listdir(os.path.join(HERE, "curriculum"))):
    CURR += open(os.path.join(HERE, "curriculum", f), encoding="utf-8").read() + "\n"
CURR_FLAT = norm(CURR)
ALL_CODES = set(re.findall(r"\[((?:9과|10통과[12]-|12[가-힣]+)\d\d-\d\d)\]", CURR))

# LESSONS.md 에서 id → 성취기준 코드 머리(예: 9과05, 12물리01)
PLAN = {}
for line in open(os.path.join(HERE, "LESSONS.md"), encoding="utf-8"):
    c = [x.strip() for x in line.split("|")]
    if len(c) > 3 and re.match(r"^[a-z0-9]+-\d+$", c[1]):
        code = next((x for x in c if re.match(r"^(9과|12[가-힣]+)\d\d$", x)), "")
        PLAN[c[1]] = code

SECTIONS = ["## 🗺️ 단원 들어가기", "## STEP 1.", "## STEP 2.", "## STEP 3.", "## STEP 4.", "## STEP 5.", "## STEP 6.",
            "## 🔬 탐구 활동", "## ✅ 개념 확인 문제", "## 📝 한눈에 정리"]


def check(path):
    text = open(path, encoding="utf-8").read()
    lines = text.split("\n")
    P = []
    m = re.match(r"^([a-z0-9]+-\d+)_", os.path.basename(path))
    lid = m.group(1) if m else ""
    if not lid:
        P.append("파일 이름이 '{id}_{제목}.md' 형식이 아님")
    if not re.match(r"^# .+?\. .+", lines[0]):
        P.append("첫 줄(H1)이 '# {표시 번호}. {제목} — {부제}' 형식이 아님")
    # 헤딩 순서
    pos = -1
    for h in SECTIONS:
        idx = next((i for i, l in enumerate(lines) if l.startswith(h)), None)
        if idx is None:
            P.append(f"헤딩 없음: {h}")
        elif idx < pos:
            P.append(f"헤딩 순서 어긋남: {h}")
        else:
            pos = idx
    # 성취기준
    stds = re.findall(r"\*\*\[((?:9과|10통과[12]-|12[가-힣]+)\d\d-\d\d)\]\*\*\s*(.+)", text.split("\n---")[0])
    one = re.search(r"\*\*성취기준 \[(10통과[12]-\d\d-\d\d)\]\*\*\s*(.+)", text)
    if one:
        stds = [(one.group(1), one.group(2))]
    if not stds:
        P.append("성취기준 상자가 없음")
    for code, body in stds:
        if code not in ALL_CODES:
            P.append(f"없는 성취기준 코드: {code}")
        elif norm(body) not in CURR_FLAT:
            P.append(f"성취기준 원문 불일치: {code}")
    head = PLAN.get(lid, "")
    if head:
        need = sorted(c for c in ALL_CODES if c.startswith(head + "-"))
        missing = [c for c in need if c not in [s[0] for s in stds]]
        if missing:
            P.append("빠진 성취기준: " + ", ".join(missing))
    # prev / next
    known = set(PLAN) | {f"{a}-{b}" for a in range(1, 7) for b in range(1, 7)}
    for key in ("prev", "next"):
        for mm in re.finditer(rf"<!--\s*{key}:\s*([^>]*?)\s*-->", text):
            for x in re.split(r"[,\s]+", mm.group(1)):
                if x and x not in known:
                    P.append(f"{key}에 없는 단원 id: {x}")
                if x == lid:
                    P.append(f"{key}에 자기 자신이 들어 있음")
    if PLAN.get(lid) and not re.search(r"<!--\s*(prev|next):", text):
        P.append("prev/next 표식이 없음")
    # STEP 5 범위 표시
    s5 = text.find("## STEP 5.")
    if s5 >= 0 and "[!CAUTION]" not in text[s5:s5 + 500]:
        P.append("STEP 5 시작에 [!CAUTION] 상자 없음")
    # details
    if text.count("<details>") != text.count("</details>"):
        P.append("details 열고 닫는 수가 다름")
    for i, l in enumerate(lines):
        s = l.strip()
        if s.startswith("<summary>") and i + 1 < len(lines) and lines[i + 1].strip():
            P.append(f"{i+1}행: <summary> 다음 빈 줄 없음")
        if s == "</details>" and lines[i - 1].strip():
            P.append(f"{i+1}행: </details> 앞 빈 줄 없음")
        if s == "<details>" and i > 0 and lines[i - 1].strip():
            P.append(f"{i+1}행: <details> 앞 빈 줄 없음")
    # mermaid
    inm = False
    for i, l in enumerate(lines):
        s = l.strip()
        if s.startswith("```mermaid"):
            inm = True
            continue
        if inm and s.startswith("```"):
            inm = False
            continue
        if inm:
            for mm in re.finditer(r"\b[A-Za-z0-9_]+([\[\(\{]{1,2})(.)", s):
                if mm.group(2) != '"':
                    P.append(f"{i+1}행: mermaid 라벨에 큰따옴표 없음 → {s[:50]}")
                    break
            if s.count('"') % 2:
                P.append(f"{i+1}행: mermaid 큰따옴표 짝이 안 맞음")
    # 수식
    if text.count("$$") % 2:
        P.append("$$ 개수가 홀수")
    code = False
    blk = False
    for i, l in enumerate(lines):
        if l.strip().startswith("```"):
            code = not code
            continue
        if code:
            continue
        if l.strip() == "$$":
            blk = not blk
            continue
        if blk:
            continue
        t = l.replace("\\$", "").replace("$$", "")
        if t.count("$") % 2:
            P.append(f"{i+1}행: $ 짝이 안 맞음")
    # 문제 수, 용어 표
    q = len(re.findall(r"^\*\*\d+\.", text, flags=re.M))
    if q < 8:
        P.append(f"확인 문제가 {q}개(8개 이상 필요)")
    if not re.search(r"###\s*핵심 용어\s*\n+\|", text):
        P.append("'### 핵심 용어' 표가 없음")
    return len(lines), q, P


def main():
    files = sys.argv[1:]
    if not files:
        for dp, _, fs in os.walk(ROOT):
            if any(x in dp for x in (".git", "node_modules", "docs", "tools")):
                continue
            files += [os.path.join(dp, f) for f in fs if re.match(r"^[a-z0-9]+-\d+_.*\.md$", f)]
        files.sort()
    bad = 0
    for f in files:
        n, q, P = check(f)
        bad += bool(P)
        print(f"{'OK ' if not P else 'ERR'} {os.path.relpath(f, ROOT)}  ({n}줄, 문제 {q}개)")
        for p in P:
            print("     -", p)
    print(f"\n총 {len(files)}개 파일, 문제 있는 파일 {bad}개")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
