import sys, json
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
open(dst, 'wb').write(im.tobytes())
json.dump({'w': im.width, 'h': im.height}, open(dst + '.meta', 'w'))
print(f'{src} -> {dst} {im.width}x{im.height}')
