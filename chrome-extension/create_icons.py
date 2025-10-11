"""
Simple script to create placeholder icons for the Chrome Extension
Run this to generate basic icon files
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """Create a simple colored icon with text"""
    # Create image with gradient background
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)
    
    # Draw a circle
    margin = size // 6
    draw.ellipse([margin, margin, size-margin, size-margin], fill='#764ba2')
    
    # Add text
    try:
        # Try to use a nice font
        font_size = size // 3
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    text = "JT"
    
    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    position = ((size - text_width) // 2, (size - text_height) // 2 - size//10)
    draw.text(position, text, fill='white', font=font)
    
    # Save
    img.save(filename)
    print(f"✓ Created {filename}")

if __name__ == '__main__':
    # Create icons directory if it doesn't exist
    icons_dir = 'icons'
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)
    
    # Create icons
    create_icon(16, os.path.join(icons_dir, 'icon16.png'))
    create_icon(48, os.path.join(icons_dir, 'icon48.png'))
    create_icon(128, os.path.join(icons_dir, 'icon128.png'))
    
    print("\n✅ All icons created successfully!")
    print("Icons saved in:", os.path.abspath(icons_dir))
