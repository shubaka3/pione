import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  LoginRequest,
  LoginResponse,
  User,
  Tree,
  CreateTreeRequest,
  UpdateTreeRequest,
  SensorReading,
  CreateSensorReadingRequest,
  Camera,
  CreateCameraRequest,
} from '@/types';
import type { RootState } from '@/app/store';

import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Trees', 'User', 'SensorReadings', 'Cameras'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/token',
        method: 'POST',
        body: credentials,
      }),
    }),
    getCurrentUser: builder.query<User, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),

    // Trees endpoints
    getTrees: builder.query<Tree[], void>({
      query: () => '/trees',
      providesTags: ['Trees'],
    }),
    getTree: builder.query<Tree, string>({
      query: (id) => `/trees/${id}`,
      providesTags: (result, error, id) => [{ type: 'Trees', id }],
    }),
    createTree: builder.mutation<Tree, CreateTreeRequest>({
      query: (treeData) => ({
        url: '/trees',
        method: 'POST',
        body: treeData,
      }),
      invalidatesTags: ['Trees'],
    }),
    updateTree: builder.mutation<Tree, { id: string; data: UpdateTreeRequest }>({
      query: ({ id, data }) => ({
        url: `/trees/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Trees', id }, 'Trees'],
    }),
    deleteTree: builder.mutation<void, string>({
      query: (id) => ({
        url: `/trees/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Trees'],
    }),

    // Sensor readings endpoints
    getSensorReadings: builder.query<SensorReading[], string>({
      query: (treeId) => `/trees/${treeId}/readings`,
      providesTags: (result, error, treeId) => [{ type: 'SensorReadings', id: treeId }],
    }),
    createSensorReading: builder.mutation<
      SensorReading,
      { treeId: string; data: CreateSensorReadingRequest }
    >({
      query: ({ treeId, data }) => ({
        url: `/trees/${treeId}/readings`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { treeId }) => [{ type: 'SensorReadings', id: treeId }],
    }),

    // Camera endpoints
    getCameras: builder.query<Camera[], void>({
      query: () => '/cameras',
      providesTags: ['Cameras'],
    }),
    createCamera: builder.mutation<Camera, CreateCameraRequest>({
      query: (cameraData) => ({
        url: '/cameras',
        method: 'POST',
        body: cameraData,
      }),
      invalidatesTags: ['Cameras'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetCurrentUserQuery,
  useGetTreesQuery,
  useGetTreeQuery,
  useCreateTreeMutation,
  useUpdateTreeMutation,
  useDeleteTreeMutation,
  useGetSensorReadingsQuery,
  useCreateSensorReadingMutation,
  useGetCamerasQuery,
  useCreateCameraMutation,
} = apiSlice;
