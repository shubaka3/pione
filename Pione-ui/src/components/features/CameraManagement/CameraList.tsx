import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchCameras, deleteCamera } from '@/features/cameras/cameraSlice';
import { Card, Button } from '@/components/common';
import { AddCameraModal } from './AddCameraModal';
import { Video, Trash2, Edit3 } from 'lucide-react';

export const CameraList: React.FC = () => {
    const dispatch = useAppDispatch();
    const cameras = useAppSelector((state) => state.cameras.cameras);
    const loading = useAppSelector((state) => state.cameras.loading);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchCameras());
    }, [dispatch]);

    const handleDelete = async (cameraId: number) => {
        if (window.confirm('Are you sure you want to delete this camera?')) {
            try {
                await dispatch(deleteCamera(cameraId)).unwrap();
            } catch (err) {
                console.error('Failed to delete camera:', err);
            }
        }
    };

    if (loading) {
        return <div className="text-center py-4">Loading cameras...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Cameras</h2>
                <Button variant="success" onClick={() => setIsAddModalOpen(true)}>
                    Add Camera
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cameras.map((camera) => (
                    <Card key={camera.camera_id} className="p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">{camera.name}</h3>
                                <p className="text-sm text-gray-500 truncate">{camera.rtsp_url}</p>
                                <div className="mt-2 flex items-center space-x-2">
                                    <span
                                        className={`inline-block w-2 h-2 rounded-full ${camera.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                    />
                                    <span className="text-sm capitalize">{camera.status}</span>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <Button variant="secondary" className="p-2">
                                    <Video size={16} />
                                </Button>
                                <Button variant="secondary" className="p-2">
                                    <Edit3 size={16} />
                                </Button>
                                <Button
                                    variant="danger"
                                    className="p-2"
                                    onClick={() => handleDelete(camera.camera_id)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <AddCameraModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        </div>
    );
};