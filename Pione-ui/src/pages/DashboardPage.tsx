import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/layout';
import { Card, Button, Modal, Input } from '@/components/common';
import {
  useGetTreesQuery,
  useCreateTreeMutation,
  useDeleteTreeMutation,
  useGetCamerasQuery,
  useCreateCameraMutation,
} from '@/features/api/apiSlice';
import type { CreateTreeRequest, CreateCameraRequest } from '@/types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: trees = [], isLoading: isLoadingTrees } = useGetTreesQuery();
  const { data: cameras = [], isLoading: isLoadingCameras } = useGetCamerasQuery();
  const [createTree] = useCreateTreeMutation();
  const [createCamera] = useCreateCameraMutation();
  const [deleteTree] = useDeleteTreeMutation();

  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const [treeFormData, setTreeFormData] = useState<CreateTreeRequest>({
    name: '',
    species: '',
    location: null,
    planting_date: null,
  });

  const [cameraFormData, setCameraFormData] = useState<CreateCameraRequest>({
    name: '',
    url: '',
  });

  const handleCreateTree = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTree(treeFormData).unwrap();
      setIsTreeModalOpen(false);
      setTreeFormData({ name: '', species: '', location: null, planting_date: null });
    } catch (err) {
      console.error('Failed to create tree:', err);
    }
  };

  const handleCreateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCamera(cameraFormData).unwrap();
      setIsCameraModalOpen(false);
      setCameraFormData({ name: '', url: '' });
    } catch (err) {
      console.error('Failed to create camera:', err);
    }
  };

  const handleDeleteTree = async (treeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa cây này?')) {
      try {
        await deleteTree(treeId).unwrap();
      } catch (err) {
        console.error('Failed to delete tree:', err);
      }
    }
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <Navbar />
      <main className="flex-grow p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold text-text-dark">Dashboard</h2>
          <div className="flex gap-4">
            <Button
              variant="success"
              onClick={() => setIsTreeModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus size={20} className="inline-block mr-2" />
              Add New Plant
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsCameraModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus size={20} className="inline-block mr-2" />
              Add Camera
            </Button>
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-4">Plants</h3>
        {isLoadingTrees ? (
          <div className="text-center text-gray-400 py-12">Loading plants...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trees.map((tree) => (
              <Card
                key={tree.tree_id}
                className="p-4 flex flex-col justify-between"
                onClick={() => navigate(`/tree/${tree.tree_id}`)}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-text-dark">{tree.name}</h3>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-primary-green/10 text-primary-green">
                      {tree.species}
                    </span>
                  </div>
                  <p className="text-sm mt-2 text-gray-300">{tree.description || 'No description'}</p>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-600">
                  <Button
                    variant="danger"
                    onClick={(e) => handleDeleteTree(tree.tree_id, e)}
                    className="text-xs flex-1 py-1 px-2"
                  >
                    <Trash2 size={14} className="inline mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <h3 className="text-2xl font-semibold mb-4 mt-8">Cameras</h3>
        {isLoadingCameras ? (
          <div className="text-center text-gray-400 py-12">Loading cameras...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cameras.map((camera) => (
              <Card
                key={camera.camera_id}
                className="p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-text-dark">{camera.name}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${camera.status ? 'bg-primary-green/10 text-primary-green' : 'bg-red-500/10 text-red-500'
                      }`}>
                      {camera.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm mt-2 text-gray-300">URL: {camera.url}</p>
                  <p className="text-sm text-gray-300">FPS: {camera.fps}</p>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-600">
                  <Button
                    variant="primary"
                    onClick={() => {/* TODO: Handle view stream */ }}
                    className="text-xs flex-1 py-1 px-2"
                  >
                    View Stream
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Tree Modal */}
      <Modal isOpen={isTreeModalOpen} onClose={() => setIsTreeModalOpen(false)} title="Thêm cây mới">
        <form onSubmit={handleCreateTree} className="space-y-4">
          <Input
            type="text"
            placeholder="Tên cây"
            value={treeFormData.name}
            onChange={(e) => setTreeFormData({ ...treeFormData, name: e.target.value })}
            required
          />
          <Input
            type="text"
            placeholder="Loại cây (Species)"
            value={treeFormData.species}
            onChange={(e) => setTreeFormData({ ...treeFormData, species: e.target.value })}
            required
          />
          <Input
            type="text"
            placeholder="Vị trí (tùy chọn)"
            value={treeFormData.location || ''}
            onChange={(e) => setTreeFormData({ ...treeFormData, location: e.target.value || null })}
          />
          <Input
            type="date"
            placeholder="Ngày trồng (tùy chọn)"
            value={treeFormData.planting_date || ''}
            onChange={(e) => setTreeFormData({ ...treeFormData, planting_date: e.target.value || null })}
          />
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="danger" type="button" onClick={() => setIsTreeModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="success" type="submit">
              Thêm
            </Button>
          </div>
        </form>
      </Modal>

      {/* Camera Modal */}
      <Modal isOpen={isCameraModalOpen} onClose={() => setIsCameraModalOpen(false)} title="Thêm camera mới">
        <form onSubmit={handleCreateCamera} className="space-y-4">
          <Input
            type="text"
            placeholder="Tên camera"
            value={cameraFormData.name}
            onChange={(e) => setCameraFormData({ ...cameraFormData, name: e.target.value })}
            required
          />
          <Input
            type="text"
            placeholder="RTSP URL"
            value={cameraFormData.url}
            onChange={(e) => setCameraFormData({ ...cameraFormData, url: e.target.value })}
            required
          />
          <Input
            type="number"
            placeholder="FPS (mặc định: 30)"
            value={cameraFormData.fps || ''}
            onChange={(e) => setCameraFormData({ ...cameraFormData, fps: parseInt(e.target.value) || 30 })}
          />
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="danger" type="button" onClick={() => setIsCameraModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="success" type="submit">
              Thêm
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
