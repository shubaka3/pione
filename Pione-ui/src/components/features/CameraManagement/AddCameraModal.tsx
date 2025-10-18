import React, { useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { Camera, createCamera } from '@/features/cameras/cameraSlice';
import { Card, Button, Input } from '@/components/common';

interface AddCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddCameraModal: React.FC<AddCameraModalProps> = ({ isOpen, onClose }) => {
    const dispatch = useAppDispatch();
    const [formData, setFormData] = useState({
        name: '',
        rtsp_url: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dispatch(createCamera(formData)).unwrap();
            onClose();
            setFormData({ name: '', rtsp_url: '' });
        } catch (err) {
            console.error('Failed to create camera:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">Add New Camera</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input
                            type="text"
                            placeholder="Camera Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Input
                            type="text"
                            placeholder="RTSP URL"
                            value={formData.rtsp_url}
                            onChange={(e) => setFormData({ ...formData, rtsp_url: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button variant="danger" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button variant="success" type="submit">
                            Add Camera
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};