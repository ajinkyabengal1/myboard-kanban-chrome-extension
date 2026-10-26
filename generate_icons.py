from PIL import Image, ImageDraw

def create_icon(size):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background with vibrant gradient / indigo-violet color
    margin = size * 0.08
    r = size * 0.22
    
    # Draw background rounded rect
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=r,
        fill=(37, 99, 235, 255) # Modern Royal Blue
    )
    
    # Draw three Kanban column cards
    col_width = (size - 2 * margin) * 0.22
    col_gap = (size - 2 * margin) * 0.08
    left_base = margin + (size - 2 * margin) * 0.12
    top_y = margin + (size - 2 * margin) * 0.22
    
    # Column 1 (tall)
    draw.rounded_rectangle(
        [left_base, top_y, left_base + col_width, top_y + (size - 2 * margin) * 0.58],
        radius=size * 0.05,
        fill=(255, 255, 255, 240)
    )
    # Column 2 (medium)
    c2_x = left_base + col_width + col_gap
    draw.rounded_rectangle(
        [c2_x, top_y, c2_x + col_width, top_y + (size - 2 * margin) * 0.42],
        radius=size * 0.05,
        fill=(255, 255, 255, 200)
    )
    # Column 3 (completed / accent)
    c3_x = c2_x + col_width + col_gap
    draw.rounded_rectangle(
        [c3_x, top_y, c3_x + col_width, top_y + (size - 2 * margin) * 0.50],
        radius=size * 0.05,
        fill=(52, 211, 153, 255) # Emerald green
    )

    return img

for sz in [16, 48, 128]:
    img = create_icon(sz)
    img.save(f'/Users/macbookair/desktop/addv/kanban-newtab-extension/icons/icon{sz}.png')

print("Icons created successfully!")
