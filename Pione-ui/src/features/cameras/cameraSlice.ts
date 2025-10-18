import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ApiService } from '@/services/api';

const api = ApiService.getInstance();

export interface Camera {
    camera_id: number;
    name: string;
    rtsp_url: string;
    status: string;
    last_connected: string;
    created_at: string;
    updated_at: string;
}

interface CameraState {
    cameras: Camera[];
    loading: boolean;
    error: string | null;
}

const initialState: CameraState = {
    cameras: [],
    loading: false,
    error: null,
};

// Thunks
export const fetchCameras = createAsyncThunk('cameras/fetchCameras', async () => {
    return await api.get<Camera[]>('/api/cameras');
});

export const createCamera = createAsyncThunk(
    'cameras/createCamera',
    async (data: { name: string; rtsp_url: string }) => {
        return await api.post<Camera>('/api/cameras', data);
    }
);

export const updateCamera = createAsyncThunk(
    'cameras/updateCamera',
    async ({ id, data }: { id: number; data: Partial<Camera> }) => {
        return await api.put<Camera>(`/api/cameras/${id}`, data);
    }
);

export const deleteCamera = createAsyncThunk('cameras/deleteCamera', async (id: number) => {
    await api.delete(`/api/cameras/${id}`);
    return id;
});

const cameraSlice = createSlice({
    name: 'cameras',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch cameras
            .addCase(fetchCameras.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCameras.fulfilled, (state, action) => {
                state.loading = false;
                state.cameras = action.payload;
            })
            .addCase(fetchCameras.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch cameras';
            })
            // Create camera
            .addCase(createCamera.fulfilled, (state, action) => {
                state.cameras.push(action.payload);
            })
            // Update camera
            .addCase(updateCamera.fulfilled, (state, action) => {
                const index = state.cameras.findIndex((c) => c.camera_id === action.payload.camera_id);
                if (index !== -1) {
                    state.cameras[index] = action.payload;
                }
            })
            // Delete camera
            .addCase(deleteCamera.fulfilled, (state, action) => {
                state.cameras = state.cameras.filter((c) => c.camera_id !== action.payload);
            });
    },
});

export default cameraSlice.reducer;