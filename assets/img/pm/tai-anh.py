# Tải toàn bộ ảnh đang dùng trên site từ pmedia.vn về thư mục này.
# Chạy:  python tai-anh.py      (cần Python 3, máy có internet)
import os, urllib.request, sys
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = 'https://pmedia.vn/wp-content/uploads/'
urls = [u.strip() for u in open(os.path.join(HERE, 'danh-sach-anh.txt'), encoding='utf-8') if u.strip()]
ok = fail = 0
for u in urls:
    out = os.path.join(HERE, *u[len(BASE):].split('/'))
    if os.path.exists(out) and os.path.getsize(out) > 0:
        ok += 1; continue
    os.makedirs(os.path.dirname(out), exist_ok=True)
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r, open(out, 'wb') as f:
            f.write(r.read())
        ok += 1; print('OK  ', u[len(BASE):])
    except Exception as e:
        fail += 1; print('LỖI ', u[len(BASE):], '-', e, file=sys.stderr)
print(f'\nXong: {ok} ảnh đã có, {fail} ảnh lỗi.')
