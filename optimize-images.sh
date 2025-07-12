#!/bin/bash

# Image Optimization Script for Coffee Market Dashboard
# This script converts existing images to optimized WebP format

echo "🖼️  Starting image optimization process..."

# Check if cwebp is installed
if ! command -v cwebp &> /dev/null; then
    echo "⚠️  cwebp is not installed. Installing WebP tools..."
    
    # Install webp tools based on the system
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        sudo apt-get update
        sudo apt-get install -y webp
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install webp
        else
            echo "❌ Homebrew not found. Please install webp tools manually."
            exit 1
        fi
    elif [[ "$OSTYPE" == "msys" ]]; then
        # Windows with Git Bash
        echo "❌ Please install webp tools manually for Windows"
        exit 1
    fi
fi

# Function to optimize image
optimize_image() {
    local input_file="$1"
    local output_file="$2"
    local quality="$3"
    
    if [[ -f "$input_file" ]]; then
        echo "🔄 Converting $input_file..."
        
        # Convert to WebP
        cwebp -q "$quality" "$input_file" -o "$output_file"
        
        # Check if conversion was successful
        if [[ -f "$output_file" ]]; then
            # Get file sizes
            original_size=$(stat -c%s "$input_file" 2>/dev/null || stat -f%z "$input_file")
            optimized_size=$(stat -c%s "$output_file" 2>/dev/null || stat -f%z "$output_file")
            
            # Calculate savings
            savings=$((100 - (optimized_size * 100 / original_size)))
            
            echo "✅ $input_file → $output_file"
            echo "   Original: $(numfmt --to=iec $original_size), Optimized: $(numfmt --to=iec $optimized_size)"
            echo "   Savings: ${savings}%"
            echo ""
        else
            echo "❌ Failed to convert $input_file"
        fi
    else
        echo "⚠️  File not found: $input_file"
    fi
}

# Optimize existing images
echo "🎯 Optimizing background images..."

# Convert coffee background images
optimize_image "coffee-abstract-dark.jpg" "coffee-abstract-dark-optimized.webp" 80
optimize_image "coffee-beans-pattern.jpg" "coffee-beans-pattern-optimized.webp" 80

# Check for other image files and optimize them
echo "🔍 Checking for other image files..."

# Find all image files in the current directory
image_files=$(find . -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | grep -v optimized)

if [[ -n "$image_files" ]]; then
    echo "📸 Found additional image files:"
    echo "$image_files"
    echo ""
    
    # Ask user if they want to optimize all images
    read -p "Do you want to optimize all found images? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        while IFS= read -r image_file; do
            if [[ -f "$image_file" ]]; then
                # Generate output filename
                filename=$(basename "$image_file")
                extension="${filename##*.}"
                name="${filename%.*}"
                output_file="${name}-optimized.webp"
                
                # Optimize with appropriate quality
                if [[ "$extension" == "png" ]]; then
                    optimize_image "$image_file" "$output_file" 90
                else
                    optimize_image "$image_file" "$output_file" 80
                fi
            fi
        done <<< "$image_files"
    fi
fi

# Create a backup of original files
echo "💾 Creating backup of original images..."
backup_dir="images-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

# Move original files to backup
for file in coffee-abstract-dark.jpg coffee-beans-pattern.jpg; do
    if [[ -f "$file" ]]; then
        cp "$file" "$backup_dir/"
        echo "📁 Backed up: $file → $backup_dir/$file"
    fi
done

echo ""
echo "✨ Image optimization complete!"
echo "📊 Summary:"
echo "   - Original images backed up to: $backup_dir"
echo "   - Optimized images ready for use"
echo "   - Update your HTML to use -optimized.webp files"
echo ""
echo "🚀 Next steps:"
echo "   1. Test the optimized images in your browser"
echo "   2. Use index-optimized.html for better performance"
echo "   3. Set up the service worker for caching"
echo ""
echo "💡 Pro tip: Use 'identify' command to verify image properties:"
echo "   identify coffee-abstract-dark-optimized.webp"