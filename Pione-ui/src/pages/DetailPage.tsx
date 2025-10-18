import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Info,
  User,
  Building2,
  Package,
  ClipboardEdit,
  CheckCircle,
  Play,
  PauseCircle,
} from 'lucide-react';
import { LiveStream } from '@/components/features';
import { Navbar } from '@/components/layout';
import { Card, Button, Modal } from '@/components/common';
import { ChatPanel } from '@/components/features/ChatPanel';
import {
  useGetTreeQuery,
  useGetSensorReadingsQuery,
  useUpdateTreeMutation,
  useCreateSensorReadingMutation,
} from '@/features/api/apiSlice';
import { useAppSelector } from '@/app/hooks';

export const DetailPage: React.FC = () => {
  const { treeId } = useParams<{ treeId: string }>();
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.user);

  const { data: tree, isLoading } = useGetTreeQuery(treeId!, { skip: !treeId });
  const { data: sensorReadings = [] } = useGetSensorReadingsQuery(treeId!, { skip: !treeId });
  const [updateTree] = useUpdateTreeMutation();
  const [createSensorReading] = useCreateSensorReadingMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  const showModal = (title: string, content: React.ReactNode) => {
    setModalTitle(title);
    setModalContent(content);
    setIsModalOpen(true);
  };

  const handleAction = async (action: string) => {
    if (!tree || !treeId) return;

    try {
      switch (action) {
        case 'getProduct':
          showModal(
            'Thông tin cây',
            <div className="space-y-2">
              <div className="flex border-b border-gray-700 py-2">
                <strong className="w-1/3 text-gray-400">ID</strong>
                <span className="w-2/3 break-all">{tree.tree_id}</span>
              </div>
              <div className="flex border-b border-gray-700 py-2">
                <strong className="w-1/3 text-gray-400">Tên</strong>
                <span className="w-2/3 break-all">{tree.name}</span>
              </div>
              <div className="flex border-b border-gray-700 py-2">
                <strong className="w-1/3 text-gray-400">Loại</strong>
                <span className="w-2/3 break-all">{tree.species}</span>
              </div>
              <div className="flex border-b border-gray-700 py-2">
                <strong className="w-1/3 text-gray-400">Vị trí</strong>
                <span className="w-2/3 break-all">{tree.location || 'N/A'}</span>
              </div>
              <div className="flex border-b border-gray-700 py-2">
                <strong className="w-1/3 text-gray-400">Ngày trồng</strong>
                <span className="w-2/3 break-all">{tree.planting_date || 'N/A'}</span>
              </div>
              <div className="flex border-b border-gray-700 py-2">
                <strong className="w-1/3 text-gray-400">Trạng thái</strong>
                <span className="w-2/3 break-all">
                  {tree.is_active ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </div>
          );
          break;

        case 'getOwner':
          showModal(
            'Thông tin chủ sở hữu',
            <div className="space-y-2">
              <div className="flex border-b border-gray-700 py-2">
                <strong className="w-1/3 text-gray-400">Username</strong>
                <span className="w-2/3 break-all">{currentUser?.username}</span>
              </div>
              <div className="flex border-b border-gray-700 py-2">
                <strong className="w-1/3 text-gray-400">Email</strong>
                <span className="w-2/3 break-all">{currentUser?.email}</span>
              </div>
              <div className="flex border-b border-gray-700 py-2">
                <strong className="w-1/3 text-gray-400">User ID</strong>
                <span className="w-2/3 break-all">{currentUser?.user_id}</span>
              </div>
              <div className="flex border-b border-gray-700 py-2">
                <strong className="w-1/3 text-gray-400">Ngày tạo</strong>
                <span className="w-2/3 break-all">
                  {currentUser?.created_at
                    ? new Date(currentUser.created_at).toLocaleString('vi-VN')
                    : 'N/A'}
                </span>
              </div>
            </div>
          );
          break;

        case 'getCompanyId':
          showModal(
            'Thông tin công ty',
            <p>Tính năng này sẽ được phát triển trong tương lai.</p>
          );
          break;

        case 'getBatches':
          if (sensorReadings.length > 0) {
            showModal(
              'Dữ liệu cảm biến (10 gần nhất)',
              <div className="space-y-2">
                {sensorReadings.slice(0, 10).map((reading) => (
                  <div key={reading.reading_id} className="border-b border-gray-700 py-2">
                    <div className="text-sm">
                      <strong>Thời gian:</strong>{' '}
                      {new Date(reading.timestamp).toLocaleString('vi-VN')}
                    </div>
                    <div className="text-xs text-gray-400">
                      Nhiệt độ: {reading.temperature_c || 'N/A'}°C | Độ ẩm:{' '}
                      {reading.humidity_pct || 'N/A'}% | Độ ẩm đất:{' '}
                      {reading.soil_moisture_pct || 'N/A'}%
                    </div>
                  </div>
                ))}
              </div>
            );
          } else {
            showModal('Dữ liệu cảm biến', <p>Chưa có dữ liệu cảm biến.</p>);
          }
          break;

        case 'updateProcesses':
          const newReading = {
            temperature_c: 25.5,
            humidity_pct: 65.0,
            soil_moisture_pct: 45.0,
            light_lux: 15000,
          };
          const readingResult = await createSensorReading({
            treeId,
            data: newReading,
          }).unwrap();
          showModal(
            'Đã cập nhật dữ liệu',
            <div className="space-y-2">
              <div className="flex border-b border-gray-700 py-2">
                <strong className="w-1/3 text-gray-400">Nhiệt độ</strong>
                <span className="w-2/3 break-all">{readingResult.temperature_c}°C</span>
              </div>
              <div className="flex border-b border-gray-700 py-2">
                <strong className="w-1/3 text-gray-400">Độ ẩm</strong>
                <span className="w-2/3 break-all">{readingResult.humidity_pct}%</span>
              </div>
            </div>
          );
          break;

        case 'updateStatus':
          await updateTree({
            id: treeId,
            data: { is_active: !tree.is_active },
          }).unwrap();
          showModal(
            'Đã cập nhật trạng thái',
            <p>Trạng thái mới: {!tree.is_active ? 'Hoạt động' : 'Không hoạt động'}</p>
          );
          break;

        case 'reactivate':
          if (window.confirm('Bạn có chắc muốn kích hoạt lại cây này?')) {
            await updateTree({ id: treeId, data: { is_active: true } }).unwrap();
            showModal('Đã kích hoạt thành công', <p>Cây đã được kích hoạt lại.</p>);
          }
          break;

        case 'deactivate':
          if (window.confirm('Bạn có chắc muốn vô hiệu hóa cây này?')) {
            await updateTree({ id: treeId, data: { is_active: false } }).unwrap();
            showModal('Đã vô hiệu hóa thành công', <p>Cây đã được vô hiệu hóa.</p>);
          }
          break;
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="h-screen w-full flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-400">Tree not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col">
      <Navbar />
      <main className="flex-grow p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col">
        <Button
          variant="secondary"
          onClick={() => navigate('/dashboard')}
          className="mb-4 px-4 py-2 text-sm self-start"
        >
          <ArrowLeft size={16} className="inline mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Image Panel */}
          <div className="lg:col-span-7 flex flex-col">
            <Card className="p-4 flex flex-col gap-4 h-full">
              <h2 className="text-xl font-bold text-text-dark">
                Phân tích: {tree.name} ({tree.species})
              </h2>
              <div className="flex-grow flex gap-4">
                <div className="bg-nature border border-sand-beige/20 rounded-nature shadow-nature hover:shadow-nature-hover transition-all duration-300 backdrop-blur-sm flex-grow relative rounded-lg overflow-hidden min-h-[300px] sm:min-h-[400px]">
                  <LiveStream />
                </div>
                <div className="flex flex-col justify-center items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => handleAction('getProduct')}
                    className="p-2"
                  >
                    <Info size={24} />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleAction('getOwner')}
                    className="p-2"
                  >
                    <User size={24} />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleAction('getCompanyId')}
                    className="p-2"
                  >
                    <Building2 size={24} />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleAction('getBatches')}
                    className="p-2"
                  >
                    <Package size={24} />
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleAction('updateProcesses')}
                    className="p-2"
                  >
                    <ClipboardEdit size={24} />
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleAction('updateStatus')}
                    className="p-2"
                  >
                    <CheckCircle size={24} />
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleAction('reactivate')}
                    className="p-2"
                  >
                    <Play size={24} />
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleAction('deactivate')}
                    className="p-2"
                  >
                    <PauseCircle size={24} />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-3">
            <ChatPanel tree={tree} sensorReadingsCount={sensorReadings.length} />
          </div>
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        {modalContent}
      </Modal>
    </div>
  );
};
