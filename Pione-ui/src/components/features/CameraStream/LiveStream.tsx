import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../../common';

interface LiveStreamProps {
    className?: string;
}

interface StreamMessage {
    type: 'live_frame' | 'analysis_result' | 'viewer_count';
    image?: string;
    result?: any;
    count?: number;
}

export const LiveStream: React.FC<LiveStreamProps> = ({ className }) => {
    const ws = useRef<WebSocket | null>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [viewerCount, setViewerCount] = useState<number>(0);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Kết nối tới WebSocket server và cleanup khi unmount
        let mounted = true;
        ws.current = new WebSocket('ws://localhost:8001/ws/viewer');

        ws.current.onopen = () => {
            if (mounted) {
                console.log('Connected to camera stream');
                setIsConnected(true);
            }
        };

        ws.current.onmessage = (event) => {
            try {
                const message: StreamMessage = JSON.parse(event.data);

                switch (message.type) {
                    case 'live_frame':
                        if (message.image) {
                            setImageUrl(message.image);
                        }
                        break;

                    case 'analysis_result':
                        if (message.result) {
                            setAnalysisResult(message.result);
                        }
                        break;

                    case 'viewer_count':
                        if (message.count !== undefined) {
                            setViewerCount(message.count);
                        }
                        break;
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };

        ws.current.onclose = () => {
            console.log('Disconnected from camera stream');
            setIsConnected(false);
        };

        // Cleanup khi component unmount
        return () => {
            mounted = false;
            if (ws.current) {
                ws.current.close();
                ws.current = null;
                setIsConnected(false);
                setViewerCount(0);
            }
        };
    }, []);

    return (
        <Card className={`p-4 ${className}`}>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Live Camera Stream</h2>
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm text-gray-600">
                            {isConnected ? `${viewerCount} watching` : 'Disconnected'}
                        </span>
                    </div>
                </div>

                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="Live stream"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-gray-500">Waiting for stream...</span>
                        </div>
                    )}
                </div>

                {analysisResult && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-2">Analysis Results</h3>
                        <pre className="text-sm overflow-auto">
                            {JSON.stringify(analysisResult, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </Card>
    );
};