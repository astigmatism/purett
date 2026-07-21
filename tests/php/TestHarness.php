<?php

/**
 * Tiny PHP 5.6-compatible test runner.
 *
 * PHPUnit 5.7 is no longer straightforward to install on current package
 * registries, so the standalone build keeps its integration suite dependency
 * free. A failed assertion exits non-zero and prints the original exception.
 */
class PurettTestHarness
{
    private $tests = array();
    private $passed = 0;
    private $failed = 0;

    public function test($name, $callback)
    {
        $this->tests[] = array($name, $callback);
    }

    public function run()
    {
        echo '1..' . count($this->tests) . PHP_EOL;
        foreach ($this->tests as $index => $test) {
            $number = $index + 1;
            try {
                call_user_func($test[1]);
                $this->passed++;
                echo 'ok ' . $number . ' - ' . $test[0] . PHP_EOL;
            } catch (Exception $exception) {
                $this->failed++;
                echo 'not ok ' . $number . ' - ' . $test[0] . PHP_EOL;
                echo '# ' . get_class($exception) . ': ' . $exception->getMessage() . PHP_EOL;
                $trace = explode("\n", $exception->getTraceAsString());
                foreach (array_slice($trace, 0, 5) as $line) {
                    echo '# ' . $line . PHP_EOL;
                }
            }
        }

        echo '# passed ' . $this->passed . ', failed ' . $this->failed . PHP_EOL;
        return $this->failed === 0 ? 0 : 1;
    }

    public static function assertTrue($condition, $message)
    {
        if (!$condition) {
            throw new RuntimeException($message);
        }
    }

    public static function assertFalse($condition, $message)
    {
        self::assertTrue(!$condition, $message);
    }

    public static function assertSame($expected, $actual, $message)
    {
        if ($expected !== $actual) {
            throw new RuntimeException(
                $message . '; expected ' . var_export($expected, true) .
                ', got ' . var_export($actual, true)
            );
        }
    }

    public static function assertCount($expected, $value, $message)
    {
        self::assertSame((int) $expected, count($value), $message);
    }

    public static function assertThrows($className, $callback, $message)
    {
        try {
            call_user_func($callback);
        } catch (Exception $exception) {
            if ($exception instanceof $className) {
                return $exception;
            }
            throw new RuntimeException(
                $message . '; expected ' . $className . ', got ' . get_class($exception) .
                ' (' . $exception->getMessage() . ')'
            );
        }
        throw new RuntimeException($message . '; no exception was thrown');
    }
}

