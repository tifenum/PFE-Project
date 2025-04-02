import os

# Specify the directory containing your hotel images
directory = "./"

# Ensure the directory exists
if not os.path.exists(directory):
    print(f"Error: Directory '{directory}' does not exist.")
    exit(1)

# Get all files in the directory
files = [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))]

# Filter for image files (common extensions)
image_extensions = (".jpg", ".jpeg", ".png", ".gif", ".bmp")
image_files = [f for f in files if f.lower().endswith(image_extensions)]

if not image_files:
    print(f"No image files found in '{directory}'.")
    exit(1)

# Sort files to ensure consistent ordering (optional)
image_files.sort()

# Counter for renaming
counter = 1

# Loop through and rename each image
for old_name in image_files:
    old_path = os.path.join(directory, old_name)
    
    # New name will be hotelX.jpg, where X is the counter
    new_name = f"hotel{counter}.jpg"
    new_path = os.path.join(directory, new_name)
    
    # Check if the new name already exists to avoid overwriting
    if os.path.exists(new_path):
        print(f"Warning: '{new_name}' already exists. Skipping '{old_name}'.")
        continue
    
    # Rename the file
    try:
        os.rename(old_path, new_path)
        print(f"Renamed '{old_name}' to '{new_name}'")
        counter += 1
    except Exception as e:
        print(f"Error renaming '{old_name}' to '{new_name}': {e}")

print(f"Renaming complete. Processed {counter - 1} images.")