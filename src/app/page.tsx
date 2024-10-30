"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { processDocument, validateMarkdown } from "@/lib/documentProcessors"
import { useState } from "react"
import { transformToMarkdown } from '@/lib/markdownTransformer';
import ReactMarkdown from 'react-markdown';

type Config = {
  headingDepth: number;
  listStyle: 'bullet' | 'numbered';
  paragraphSpacing: 'single' | 'double';
  emphasisStyle: 'asterisk' | 'underscore';
  codeBlockStyle: 'indented' | 'fenced';
}

type ProcessingMode = 'rule-based' | 'ai';

export default function Home() {
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [config, setConfig] = useState<Config>({
    headingDepth: 2,
    listStyle: 'bullet',
    paragraphSpacing: 'single',
    emphasisStyle: 'asterisk',
    codeBlockStyle: 'fenced'
  })
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('ai')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcess = async () => {
    setIsProcessing(true)
    try {
      if (processingMode === 'ai') {
        const markdown = transformToMarkdown(inputText)
        setOutputText(markdown)
      } else {
        const markdown = processDocument(inputText, config)
        setOutputText(markdown)
      }
    } catch (error) {
      console.error('Processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Markdown Structure Generator</h1>
          <p className="text-muted-foreground">
            Convert unstructured text into well-formatted markdown with customizable rules
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Input Text</CardTitle>
              <CardDescription>Paste your unstructured text here</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your text here..."
                className="min-h-[400px] font-mono"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Formatting Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Header Depth</label>
                  <Slider
                    value={[config.headingDepth]}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, headingDepth: value[0] }))}
                    min={1}
                    max={6}
                    step={1}
                  />
                  <span className="text-sm text-muted-foreground">H{config.headingDepth}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">List Style</label>
                  <Select 
                    value={config.listStyle}
                    onValueChange={(value: 'bullet' | 'numbered') => 
                      setConfig((prev: Config) => ({ ...prev, listStyle: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bullet">Bullet Points</SelectItem>
                      <SelectItem value="numbered">Numbered List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Paragraph Spacing</label>
                  <Select 
                    value={config.paragraphSpacing}
                    onValueChange={(value: 'single' | 'double') => 
                      setConfig((prev: Config) => ({ ...prev, paragraphSpacing: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Processing Mode</label>
                  <Select 
                    value={processingMode}
                    onValueChange={(value: ProcessingMode) => setProcessingMode(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai">AI-Powered</SelectItem>
                      <SelectItem value="rule-based">Rule-Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleProcess} 
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Generate Markdown'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Output</CardTitle>
                <CardDescription>
                  Generated markdown with current formatting rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="preview">
                  <TabsList className="mb-4">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview">
                    <div className="prose dark:prose-invert max-w-none">
                      <ReactMarkdown>{outputText}</ReactMarkdown>
                    </div>
                  </TabsContent>
                  <TabsContent value="markdown">
                    <Textarea
                      readOnly
                      className="min-h-[200px] font-mono"
                      value={outputText}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
