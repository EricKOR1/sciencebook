#!/bin/bash
# OpenStax 공개 교과서 원본을 /home/user/openstax 에 받고, 라이선스가 CC BY 4.0 이던 마지막 판으로 맞춘 뒤 그림 색인을 만든다.
# (OpenStax 는 2026-03 부터 새 판을 CC BY-NC-SA 로 바꾸었다. 그 직전 판만 쓴다.)  컨테이너가 새로 만들어졌을 때 한 번 돌린다. 20분쯤 걸린다.
set -u
mkdir -p /home/user/openstax
for r in osbooks-biology-bundle osbooks-anatomy-physiology osbooks-chemistry-bundle osbooks-university-physics-bundle osbooks-astronomy osbooks-microbiology osbooks-college-physics-bundle; do
  d=/home/user/openstax/$r
  if [ ! -d "$d/.git" ]; then
    GIT_LFS_SKIP_SMUDGE=1 git clone --quiet --depth 1 "https://github.com/openstax/$r" "$d" || { echo "받지 못함: $r"; continue; }
  fi
  cd "$d" || continue
  if ! head -1 LICENSE | grep -q '^Attribution 4.0'; then
    git fetch --quiet --filter=blob:none --depth=4000 origin
    R=""
    for c in $(git log --format=%H -- LICENSE); do
      if git show "$c:LICENSE" | head -1 | grep -q NonCommercial; then R=$c; fi     # 가장 오래된 '비영리' 판
    done
    [ -n "$R" ] && git checkout --quiet "$R^"
  fi
  echo "$r → $(git log -1 --format='%h %ad' --date=short) | $(head -1 LICENSE)"
done
python3 "$(dirname "$0")/openstax.py" index
