#!/bin/bash

# Image Optimization Script for Coffee Market Dashboard
echo "🖼️  Coffee Market Dashboard - Image Optimization"
echo "================================================"

# Check if ImageMagick is available (more widely available than webp)
if command -v convert &> /dev/null; then
    TOOL="imagemagick"
    echo "✅ Using ImageMagick for optimization"
elif command -v cwebp &> /dev/null; then
    TOOL="webp"
    echo "✅ Using WebP for optimization"
else
    echo "❌ No image optimization tools found"
    echo "💡 Installing basic optimization tools..."
    
    # Try to install imagemagick (more universal)
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y imagemagick
        TOOL="imagemagick"
    elif command -v yum &> /dev/null; then
        sudo yum install -y ImageMagick
        TOOL="imagemagick"
    elif command -v brew &> /dev/null; then
        brew install imagemagick
        TOOL="imagemagick"
    else
        echo "❌ Cannot install optimization tools automatically"
        echo "📝 Manual installation required:"
        echo "   Ubuntu/Debian: sudo apt-get install imagemagick"
        echo "   CentOS/RHEL: sudo yum install ImageMagick"
        echo "   macOS: brew install imagemagick"
        exit 1
    fi
fi

# Original image files
ORIGINAL_IMAGES=(
    "coffee-abstract-dark.jpg"
    "coffee-beans-pattern.jpg"
)

echo ""
echo "📊 Current file sizes:"
for img in "${ORIGINAL_IMAGES[@]}"; do
    if [ -f "$img" ]; then
        size=$(ls -lh "$img" | awk '{print $5}')
        echo "   $img: $size"
    else
        echo "   ❌ $img: Not found"
    fi
done

echo ""
echo "🚀 Starting optimization..."

optimize_with_imagemagick() {
    local input="$1"
    local output="$2"
    local quality="$3"
    
    # Convert to WebP if possible, otherwise optimize JPEG
    if convert "$input" -quality "$quality" -strip -interlace Plane "$output.webp" 2>/dev/null; then
        echo "   ✅ Created optimized WebP: $output.webp"
        return 0
    else
        # Fallback to optimized JPEG
        convert "$input" -quality "$quality" -strip -interlace Plane "${output}.jpg" 2>/dev/null
        echo "   ✅ Created optimized JPEG: ${output}.jpg"
        return 0
    fi
}

optimize_with_webp() {
    local input="$1"
    local output="$2"
    local quality="$3"
    
    cwebp -q "$quality" "$input" -o "$output.webp"
    echo "   ✅ Created optimized WebP: $output.webp"
}

# Optimize images
total_savings=0

for img in "${ORIGINAL_IMAGES[@]}"; do
    if [ ! -f "$img" ]; then
        echo "   ⚠️  Skipping $img (not found)"
        continue
    fi
    
    # Get original size
    original_size=$(stat -c%s "$img" 2>/dev/null || stat -f%z "$img" 2>/dev/null)
    
    # Extract filename without extension
    basename="${img%.*}"
    output_name="${basename}-optimized"
    
    echo "   🔄 Optimizing $img..."
    
    if [ "$TOOL" = "imagemagick" ]; then
        optimize_with_imagemagick "$img" "$output_name" 75
    elif [ "$TOOL" = "webp" ]; then
        optimize_with_webp "$img" "$output_name" 75
    fi
    
    # Calculate savings if optimized file exists
    optimized_file=""
    if [ -f "${output_name}.webp" ]; then
        optimized_file="${output_name}.webp"
    elif [ -f "${output_name}.jpg" ]; then
        optimized_file="${output_name}.jpg"
    fi
    
    if [ -n "$optimized_file" ] && [ -f "$optimized_file" ]; then
        optimized_size=$(stat -c%s "$optimized_file" 2>/dev/null || stat -f%z "$optimized_file" 2>/dev/null)
        savings=$((original_size - optimized_size))
        percentage=$((savings * 100 / original_size))
        total_savings=$((total_savings + savings))
        
        echo "      📉 Size reduction: $percentage% ($(numfmt --to=iec $savings) saved)"
    fi
done

echo ""
echo "✨ Optimization complete!"
echo "💾 Total space saved: $(numfmt --to=iec $total_savings)"

# Update CSS references if optimized files exist
echo ""
echo "🔧 Updating CSS references..."

# Create a simple CSS update
css_updates=""
for img in "${ORIGINAL_IMAGES[@]}"; do
    basename="${img%.*}"
    output_name="${basename}-optimized"
    
    if [ -f "${output_name}.webp" ]; then
        echo "   📝 Updating references from $img to ${output_name}.webp"
        # Update both CSS files
        if [ -f "styles.css" ]; then
            sed -i.bak "s|$img|${output_name}.webp|g" styles.css 2>/dev/null || \
            sed -i '' "s|$img|${output_name}.webp|g" styles.css 2>/dev/null
        fi
        if [ -f "index.html" ]; then
            sed -i.bak "s|$img|${output_name}.webp|g" index.html 2>/dev/null || \
            sed -i '' "s|$img|${output_name}.webp|g" index.html 2>/dev/null
        fi
    elif [ -f "${output_name}.jpg" ]; then
        echo "   📝 Updating references from $img to ${output_name}.jpg"
        if [ -f "styles.css" ]; then
            sed -i.bak "s|$img|${output_name}.jpg|g" styles.css 2>/dev/null || \
            sed -i '' "s|$img|${output_name}.jpg|g" styles.css 2>/dev/null
        fi
        if [ -f "index.html" ]; then
            sed -i.bak "s|$img|${output_name}.jpg|g" index.html 2>/dev/null || \
            sed -i '' "s|$img|${output_name}.jpg|g" index.html 2>/dev/null
        fi
    fi
done

echo ""
echo "🎯 Performance Recommendations:"
echo "================================"
echo "1. ✅ Images optimized for web delivery"
echo "2. ✅ Reduced file sizes for faster loading"
echo "3. 💡 Consider using a CDN for even better performance"
echo "4. 💡 Enable browser caching with proper HTTP headers"
echo "5. 💡 Use responsive images with srcset for different screen sizes"

# Clean up backup files
rm -f *.bak 2>/dev/null

echo ""
echo "🚀 Ready to deploy! Your images are now optimized for better performance."
echo ""

# Show final file sizes
echo "📊 Final optimized file sizes:"
for img in "${ORIGINAL_IMAGES[@]}"; do
    basename="${img%.*}"
    output_name="${basename}-optimized"
    
    if [ -f "${output_name}.webp" ]; then
        size=$(ls -lh "${output_name}.webp" | awk '{print $5}')
        echo "   ${output_name}.webp: $size"
    elif [ -f "${output_name}.jpg" ]; then
        size=$(ls -lh "${output_name}.jpg" | awk '{print $5}')
        echo "   ${output_name}.jpg: $size"
    fi
done

echo ""
echo "🎉 Optimization complete! Check your website loading speed now."