import React, { useState, useEffect } from 'react';
import { ModalHeader, ModalBody, ModalFooter, Button, Input } from "@nextui-org/react";
import { useSession } from "next-auth/react";
import { useLoading } from "@/lib/hooks";
import { updateRoom } from "@/lib/actions";
import { useStore } from '@/lib/store';
import { Select, SelectItem } from "@nextui-org/react";

const editRoom = async (id: string, name: string) => {
  if (name.trim() === '') return;
  await updateRoom(id, name);
  window.location.reload();  
};

interface EditRoomModalProps {
  room: { id: string; name: string };
}
const ImageGallery: React.FC<{ onSelect: (imageUrl: string) => void }> = ({ onSelect }) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');

  const fetchImages = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const url = query
        ? `https://api.unsplash.com/search/photos?query=${query}&page=${page}&per_page=9&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`
        : `https://api.unsplash.com/photos/random?count=9&page=${page}&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      const newImages = query ? data.results.map((item: any) => item.urls.regular) : data.map((item: any) => item.urls.regular);
      setImages(prevImages => [...prevImages, ...newImages]);
      setPage(prevPage => prevPage + 1);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [query]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop === clientHeight) {
      fetchImages();
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setImages([]);
    setPage(1);
    fetchImages();
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4">
        <Input
          placeholder="Search images..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" color="primary" className="mt-2" size="sm"  >Search</Button>
      </form>
      <div className="h-64 overflow-y-auto" onScroll={handleScroll}>
        <div className="grid grid-cols-3 gap-2">
          {images.map((imageUrl, index) => (
            <img
              key={index}
              src={imageUrl}
              alt={`Unsplash image ${index + 1}`}
              className="w-full h-24 object-cover cursor-pointer"
              onClick={() => onSelect(imageUrl)}
            />
          ))}
        </div>
        {loading && <div className="text-center mt-4">Loading more images...</div>}
      </div>
    </div>
  );
};

const EditRoomModal: React.FC<EditRoomModalProps> = ({ room }) => {
  const [roomName, setRoomName] = useState(room.name);
  const { isLoading, call } = useLoading(() => editRoom(room.id, roomName))
  const { background, setBackground } = useStore((state) => state);
  const handleBackgroundTypeChange = (value: string) => {
    setBackground({ ...background, type: value as "image" | "color" });
  };

  const handleBackgroundValueChange = (value: string) => {
    setBackground({ ...background, [background.type]: value });
  };

  const handleImageSelect = (imageUrl: string) => {
    setBackground({ ...background, image: imageUrl });
  };

  return (
    <div>
      <ModalHeader>Edit Room</ModalHeader>
      <ModalBody>
          <Input
            placeholder="Enter room name"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                call();
              }
            }}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
           <Select
          label="Background Type"
          value={background.type}
          onChange={(e) => handleBackgroundTypeChange(e.target.value)}
        >
          <SelectItem key="color" value="color">Color</SelectItem>
          <SelectItem key="image" value="image">Image</SelectItem>
        </Select>
        {background.type === 'color' ? (
          <Input
            type="color"
            label="Background Color"
            value={background.color}
            onChange={(e) => handleBackgroundValueChange(e.target.value)}
          />
        ) : (
          <ImageGallery onSelect={handleImageSelect} />
        )}
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onClick={() => window.closeModal('editRoom')}>
            Cancel
          </Button>
          <Button color="primary" isLoading={isLoading} onClick={call}>
            Save Changes
          </Button>
        </ModalFooter>
    </div>
  );
};

export default EditRoomModal;