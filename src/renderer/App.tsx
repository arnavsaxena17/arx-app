import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Theme, mq, ThemeType } from '../common/theme';

// Add the correct type definition for emotion theme
declare module '@emotion/react' {
  export interface Theme extends ThemeType {}
}

// Global types
declare global {
  interface Window {
    electronAPI: {
      downloadExtension: (savePath?: string) => Promise<{
        success: boolean;
        path: string;
        message: string;
      }>;
      getExtensionInfo: () => Promise<{
        path: string;
        lastUpdated: number;
      }>;
      onExtensionUpdated: (callback: (data: { path: string; timestamp: number }) => void) => void;
    };
  }
}

// Define a module augmentation for @emotion/styled
declare module '@emotion/styled' {
  export interface Theme extends ThemeType {}
}

// Styled components
const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg};
  max-width: 800px;
  margin: 0 auto;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  color: ${({ theme }) => theme.colors.text};
`;

const StyledHeader = styled.header`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const StyledTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.heading.fontSize};
  line-height: ${({ theme }) => theme.typography.heading.lineHeight};
  font-weight: ${({ theme }) => theme.typography.heading.fontWeight};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`;

const StyledSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
  margin: 0;
  color: ${({ theme }) => theme.colors.text}AA;
`;

const StyledButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 240px;
  margin: ${({ theme }) => theme.spacing.lg} 0;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}DD;
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.lightGray};
    cursor: not-allowed;
  }
`;

const StyledStatusBox = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.lightGray};
  width: 100%;
  max-width: 600px;
`;

const StyledStatus = styled.p<{ type: 'success' | 'error' | 'info' }>`
  margin: ${({ theme }) => theme.spacing.xs} 0;
  color: ${({ theme, type }) => 
    type === 'success' 
      ? theme.colors.success 
      : type === 'error' 
      ? theme.colors.error 
      : theme.colors.text
  };
`;

const StyledInstructions = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.lightGray}33;
  width: 100%;
  max-width: 600px;
`;

const StyledInstructionTitle = styled.h2`
  font-size: 18px;
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`;

const StyledInstructionStep = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const StyledStepNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  font-size: 14px;
  margin-right: ${({ theme }) => theme.spacing.sm};
`;

const StyledLastUpdated = styled.p`
  font-size: ${({ theme }) => theme.typography.small.fontSize};
  color: ${({ theme }) => theme.colors.text}99;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

// Main App component
type Status = {
  message: string;
  type: 'success' | 'error' | 'info';
};

type ExtensionInfo = {
  path: string;
  lastUpdated: number;
};

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [extensionInfo, setExtensionInfo] = useState<ExtensionInfo | null>(null);

  useEffect(() => {
    const initializeExtension = async () => {
      // Get current extension info
      const info = await window.electronAPI.getExtensionInfo();
      setExtensionInfo(info);
      
      // Download/update extension
      handleDownloadExtension();
    };

    // Set up listener for extension updates
    window.electronAPI.onExtensionUpdated((data) => {
      setExtensionInfo({
        path: data.path,
        lastUpdated: data.timestamp
      });
      setStatus({
        message: 'Extension updated automatically',
        type: 'success'
      });
    });

    initializeExtension();
  }, []);
  
  const handleDownloadExtension = async () => {
    setIsLoading(true);
    setStatus({
      message: 'Downloading extension...',
      type: 'info'
    });

    try {
      const result = await window.electronAPI.downloadExtension();
      if (result.success) {
        setExtensionInfo({
          path: result.path,
          lastUpdated: Date.now()
        });
        setStatus({
          message: 'Extension downloaded successfully',
          type: 'success'
        });
      } else {
        setStatus({
          message: result.message || 'Failed to download extension',
          type: 'error'
        });
      }
      
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : 'An error occurred',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  console.log("Extension info::", extensionInfo);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledTitle>Arxena Extension Manager</StyledTitle>
        <StyledSubtitle>
          Download and manage your Arxena extension
        </StyledSubtitle>
      </StyledHeader>

      <StyledButton 
        onClick={handleDownloadExtension} 
        disabled={isLoading}
      >
        {isLoading ? 'Downloading...' : 'Download Chrome Extension'}
      </StyledButton>

      {status && (
        <StyledStatusBox>
          <StyledStatus type={status.type}>{status.message}</StyledStatus>
          {extensionInfo && (
            <StyledLastUpdated>
              Last updated: {formatDate(extensionInfo.lastUpdated)}
            </StyledLastUpdated>
          )}
        </StyledStatusBox>
      )}

      {extensionInfo?.path && (
        <StyledInstructions>
          <StyledInstructionTitle>Installation Instructions</StyledInstructionTitle>
          
          <StyledInstructionStep>
            <StyledStepNumber>1</StyledStepNumber>
            The arx-crx extension has been downloaded to: {extensionInfo.path}
          </StyledInstructionStep>
          
          <StyledInstructionStep>
            <StyledStepNumber>2</StyledStepNumber>
            Open Chrome and navigate to <code>chrome://extensions</code>
          </StyledInstructionStep>
          
          <StyledInstructionStep>
            <StyledStepNumber>3</StyledStepNumber>
            Enable "Developer mode" using the toggle in the top-right corner
          </StyledInstructionStep>
          
          <StyledInstructionStep>
            <StyledStepNumber>4</StyledStepNumber>
            Click "Load unpacked" and select the extension folder arx-crx from: {extensionInfo.path}
          </StyledInstructionStep>
          
          {/* <StyledInstructionStep>
            <StyledStepNumber>5</StyledStepNumber>
            The extension will automatically update every 10 minutes
          </StyledInstructionStep> */}
        </StyledInstructions>
      )}
    </StyledContainer>
  );
};