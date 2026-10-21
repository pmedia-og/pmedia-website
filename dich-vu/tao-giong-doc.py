#!/usr/bin/env python3
"""
Tạo giọng đọc thu sẵn (giọng AI tiếng Việt chất lượng cao của Microsoft) cho các trang dịch vụ 3D.

Không bắt buộc: khi chưa chạy, trang dùng giọng đọc có sẵn của trình duyệt.
Sau khi chạy, mỗi trang dịch vụ có thư mục giong-doc/ và mọi trình duyệt đều nghe cùng một giọng,
thời gian khớp tuyệt đối với hình, rất hợp để quay màn hình làm video.

Cách dùng (cần Python 3.8+ và internet):
    pip install edge-tts
    python tao-giong-doc.py                  # giọng nữ HoaiMy, tất cả video
    python tao-giong-doc.py --giong nam      # giọng nam NamMinh
    python tao-giong-doc.py --toc-do +8%     # đọc nhanh hơn một chút
    python tao-giong-doc.py webcare seo-tu-khoa   # chỉ tạo cho vài video
Chạy file này ngay trong thư mục dich-vu.
"""
import asyncio, json, os, sys, argparse

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('slugs', nargs='*')
    ap.add_argument('--giong', default='nu', choices=['nu', 'nam'])
    ap.add_argument('--toc-do', default='+4%')
    a = ap.parse_args()
    try:
        import edge_tts
    except ImportError:
        sys.exit('Chưa có edge-tts. Chạy: pip install edge-tts')
    voice = 'vi-VN-HoaiMyNeural' if a.giong == 'nu' else 'vi-VN-NamMinhNeural'
    here = os.path.dirname(os.path.abspath(__file__))
    data = json.load(open(os.path.join(here, 'loi-doc.json'), encoding='utf-8'))
    slugs = a.slugs or list(data)

    async def one(text, path):
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, voice, rate=a.toc_do).save(path)
                return
            except Exception as e:
                if attempt == 2: raise
                await asyncio.sleep(2)

    async def run():
        for slug in slugs:
            out = os.path.join(here, slug, 'giong-doc'); os.makedirs(out, exist_ok=True)
            durs = []
            for i, text in enumerate(data[slug], 1):
                p = os.path.join(out, f'{i:02d}.mp3')
                await one(text, p)
                durs.append(round(os.path.getsize(p) * 8 / 48000 + 0.05, 3))  # mp3 48 kbit/s
                print(f'  {slug} {i:02d}/{len(data[slug])}', end='\r')
            with open(os.path.join(out, 'giong-doc.js'), 'w', encoding='utf-8') as f:
                f.write('window.PM_VOICE=' + json.dumps({'base': 'giong-doc/', 'voice': voice, 'd': durs}) + ';\n')
            print(f'✓ {slug}: {len(durs)} câu, {sum(durs):.0f} giây      ')
    asyncio.run(run())
    print('Xong. Mở lại trang dịch vụ để nghe giọng mới. Muốn quay lại giọng trình duyệt: xoá thư mục giong-doc.')

if __name__ == '__main__':
    main()
